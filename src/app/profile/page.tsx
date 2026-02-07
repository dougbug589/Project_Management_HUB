"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Form"
import { User, Pencil, Mail, Shield, MessageSquare, ImageIcon } from "lucide-react"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: "",
    bio: "",
    avatar: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.data)
        setForm({
          name: data.data.name || "",
          bio: data.data.bio || "",
          avatar: data.data.avatar || "",
        })
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setIsEditing(false)
        fetchProfile()
        // Update localStorage
        const data = await res.json()
        localStorage.setItem("user", JSON.stringify(data.data))
      }
    } catch (error) {
      console.error("Update profile error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-gray-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <User className="w-10 h-10 text-violet-500" />
            Profile
          </h1>
          <p className="text-gray-400">Manage your account settings</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-violet-500" />
                <span>User Profile</span>
              </CardTitle>
              <Button 
                variant={isEditing ? "secondary" : "primary"} 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  label="Name"
                  value={form.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  label="Bio"
                  value={form.bio}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, bio: e.target.value })}
                />
                <Input
                  label="Avatar URL"
                  value={form.avatar}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, avatar: e.target.value })}
                />
                <Button variant="primary" onClick={handleUpdate}>Save Changes</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <User className="w-4 h-4" /> Name
                  </p>
                  <p className="text-lg font-medium text-white">{user?.name}</p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Mail className="w-4 h-4" /> Email
                  </p>
                  <p className="text-lg text-white">{user?.email}</p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Shield className="w-4 h-4" /> Role
                  </p>
                  <span className="inline-block px-3 py-1 bg-violet-600 text-white rounded-full text-sm font-medium">
                    {user?.role}
                  </span>
                </div>
                {user?.bio && (
                  <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" /> Bio
                    </p>
                    <p className="text-lg text-white">{user.bio}</p>
                  </div>
                )}
                {user?.avatar && (
                  <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" /> Avatar
                    </p>
                    <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-violet-600" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
