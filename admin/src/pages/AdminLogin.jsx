import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import BackgroundEffects from '../components/BackgroundEffects'
import BrandSection from '../components/BrandSection'
import LoginCard from '../components/LoginCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Invalid email or password')
        return
      }

      // Block non-admin users
      if (data.user?.role !== 'admin') {
        setError('Access denied. Admin privileges required.')
        return
      }

      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('adminUser', JSON.stringify(data.user))

      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError('Connection failed. Please check the server is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (error) setError('')
  }

  return (
    <div className="bg-background-secondary text-text-primary antialiased min-h-screen relative overflow-hidden flex items-center justify-center">
      <BackgroundEffects />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-6xl px-4 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 h-full"
      >
        <BrandSection />
        <LoginCard
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          error={error}
          loading={loading}
        />
      </motion.main>
    </div>
  )
}

export default AdminLogin
