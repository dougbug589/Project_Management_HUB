"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

interface User {
  id: string
  name: string
  email: string
  role?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentUserRole, setCurrentUserRole] = useState<string>("")

  useEffect(() => {
    fetchUsers()
    fetchCurrentUserRole()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUserRole = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentUserRole(data.data?.role || "")
      }
    } catch (error) {
      // fallback: no role
    }
  }

  const handleRemove = async (userId: string) => {
    setRemovingId(userId)
    setError("")
    setSuccess("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setSuccess("User removed successfully.")
        setUsers((prev) => prev.filter((u) => u.id !== userId))
      } else {
        const data = await res.json()
        setError(data.message || "Failed to remove user.")
      }
    } catch (err) {
      setError("Failed to remove user.")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Users</h1>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        {success && <div className="text-green-400 mb-2">{success}</div>}
        {loading ? (
          <div className="text-gray-400">Loading users...</div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-400">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <CardTitle>{user.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{user.email}</p>
                  {currentUserRole === "SUPER_ADMIN" && (
                    <Button
                      variant="danger"
                      className="mt-4"
                      disabled={removingId === user.id}
                      onClick={() => handleRemove(user.id)}
                    >
                      {removingId === user.id ? "Removing..." : "Remove"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
