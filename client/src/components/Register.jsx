import React, { useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const Register = ({ onClose, onSignIn, onSuccess }) => {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    try {
      await register(form)
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  return (
    <div className='fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-4'>
      <form onSubmit={submit} className='relative max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl'>
        <button type='button' onClick={onClose} className='absolute right-4 top-4 text-slate-400' aria-label='Close registration'><X className='w-5' /></button>
        <h2 className='text-2xl font-semibold text-slate-800'>Create your account</h2>
        <p className='mt-1 text-sm text-slate-500'>One account gives you access to every AI tool.</p>
        <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder='Full name' className='mt-6 w-full rounded-md border p-3 text-sm' />
        <input required type='email' value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder='Email address' className='mt-3 w-full rounded-md border p-3 text-sm' />
        <div className='relative mt-3'>
          <input required minLength={6} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder='Password' className='w-full rounded-md border p-3 pr-11 text-sm' />
          <button type='button' onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-500'>
            {showPassword ? <EyeOff className='w-5' /> : <Eye className='w-5' />}
          </button>
        </div>
        <button className='mt-5 w-full rounded-md bg-primary py-3 text-sm font-medium text-white'>Create account</button>
        <button type='button' onClick={onSignIn} className='mt-4 w-full text-sm text-slate-500'>Already have an account? Sign in</button>
      </form>
    </div>
  )
}

export default Register
