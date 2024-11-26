'use client'

import { useState, useEffect } from 'react'
import Layout from './components/layout'
import { profileService } from './lib/api-client'
import { Profile } from './types/profile'

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileService.getProfile()
        setProfile(response.data)
      } catch (err) {
        setError('Failed to fetch profile')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return (
    <Layout>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : profile ? (
        <div>
          <p>Welcome, {profile.name}!</p>
          <p>Email: {profile.email}</p>
          {/* Add more profile information or dashboard widgets here */}
        </div>
      ) : null}
    </Layout>
  )
}

