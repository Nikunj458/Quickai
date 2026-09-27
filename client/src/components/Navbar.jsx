import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import SignIn from './SignIn'
import Register from './Register'

const Navbar = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [mode, setMode] = useState('login')


  return (
    <>
      <div className='fixed z-5 w-full backdrop-blur-2xl flex justify-between items-center py-3 px-4 sm:px-20 xl:px-32'>
      <img onClick={()=>navigate('/')} className='w-32 sm:w-44 cursor-pointer' src={assets.logo} alt="logo" />

      {
        user ? <button onClick={() => navigate('/ai')} className='flex items-center gap-2 rounded-full text-sm cursor-pointer bg-primary text-white px-6 py-2.5'>Open workspace
          <ArrowRight className='w-4 h-4'/></button> :(
          <button onClick={() => setShowAuth(true)} className='flex items-center gap-2 rounded-full text-sm cursor-pointer bg-primary text-white px-10 py-2.5'>Get started
          <ArrowRight className='w-4 h-4'/></button>
        )
      }

      </div>
      {showAuth && mode === 'login' && <SignIn onClose={() => setShowAuth(false)} onRegister={() => setMode('register')} onSuccess={() => { setShowAuth(false); navigate('/ai') }} />}
      {showAuth && mode === 'register' && <Register onClose={() => setShowAuth(false)} onSignIn={() => setMode('login')} onSuccess={() => { setShowAuth(false); navigate('/ai') }} />}
    </>
  )
}

export default Navbar