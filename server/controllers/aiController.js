
import OpenAI from "openai";
import sql from "../configs/db.js";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import FormData from "form-data";

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const GEMINI_TEXT_MODEL = "gemini-3.8-flash";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateWithRetry = async (params, maxRetries = 3) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await AI.chat.completions.create(params);
    } catch (error) {
      const status = error.status || error.response?.status;

      if (status !== 503 || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(1000 * 2 ** attempt, 8000);

      console.log(
        `Gemini returned 503. Retry ${attempt + 1}/${maxRetries} in ${delay}ms`
      );

      await sleep(delay);
    }
  }
};
const handleApiError = (error, res, operation) => {
  console.error(`\n${operation} failed`);
  console.error("Message:", error.message);
  console.error("Status:", error.status || error.response?.status);
  console.error("Response:", error.response?.data);

  return res.status(error.status || error.response?.status || 500).json({
    success: false,
    message: error.message || "Something went wrong"
  });
};

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.user;
    const { prompt, length } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required"
      });
    }

    const response = await generateWithRetry({
  model: GEMINI_TEXT_MODEL,
  messages: [
    {
      role: "user",
      content: prompt
    }
  ],
  temperature: 0.7,
  max_tokens: length || 1000
});

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI returned empty content");
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `;

    return res.json({
      success: true,
      content
    });

  } catch (error) {
    return handleApiError(error, res, "Generate Article");
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.user;
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required"
      });
    }

    const response = await AI.chat.completions.create({
      model: GEMINI_TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI returned empty content");
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
    `;

    return res.json({
      success: true,
      content
    });

  } catch (error) {
    return handleApiError(error, res, "Generate Blog Title");
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { prompt, publish } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required"
      });
    }

    const formData = new FormData();

    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "x-api-key": process.env.CLIPDROP_API_KEY
        },
        responseType: "arraybuffer",
        timeout: 120000
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(data).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image, {
      resource_type: "image"
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (
        ${userId},
        ${prompt},
        ${secure_url},
        'image',
        ${publish ?? false}
      )
    `;

    return res.json({
      success: true,
      content: secure_url
    });

  } catch (error) {
    return handleApiError(error, res, "Generate Image");
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.user;
    const image = req.file;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image file is required"
      });
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background"
        }
      ]
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (
        ${userId},
        'Remove background from image',
        ${secure_url},
        'image'
      )
    `;

    return res.json({
      success: true,
      content: secure_url
    });

  } catch (error) {
    return handleApiError(error, res, "Remove Image Background");
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.user;
    const { object } = req.body;
    const image = req.file;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image file is required"
      });
    }

    if (!object || !object.trim()) {
      return res.status(400).json({
        success: false,
        message: "Object is required"
      });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);

    const imageUrl = cloudinary.url(public_id, {
      transformation: [
        {
          effect: `gen_remove:${object}`
        }
      ],
      resource_type: "image"
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (
        ${userId},
        ${`Removed ${object} from image`},
        ${imageUrl},
        'image'
      )
    `;

    return res.json({
      success: true,
      content: imageUrl
    });

  } catch (error) {
    return handleApiError(error, res, "Remove Image Object");
  }
};

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.user;
    const resume = req.file;

    if (!resume) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required"
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Resume file size exceeds 5MB limit."
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);

    const prompt = `
Review the following resume and provide constructive feedback
on its strengths, weaknesses, and areas for improvement.

Resume Content:

${pdfData.text}
`;

    const response = await AI.chat.completions.create({
      model: GEMINI_TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI returned empty content");
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (
        ${userId},
        'Review the uploaded resume',
        ${content},
        'resume-review'
      )
    `;

    return res.json({
      success: true,
      content
    });

  } catch (error) {
    return handleApiError(error, res, "Resume Review");
  }
};