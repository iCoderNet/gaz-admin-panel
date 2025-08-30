import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Package, Settings, DollarSign } from 'lucide-react'
import api from '@/lib/api'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<{
    users: number
    orders: number
    azots: number
    services: number
  } | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats')
        setStats(response.data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { title: 'Всего пользователей', value: stats?.users ?? '—', icon: Users },
    { title: 'Заказы', value: stats?.orders ?? '—', icon: Package },
    { title: 'Азотные товары', value: stats?.azots ?? '—', icon: DollarSign },
    { title: 'Дополнительные услуги', value: stats?.services ?? '—', icon: Settings },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Панель управления</h1>
          <p className="text-muted-foreground">
            Добро пожаловать обратно, {user?.username}!
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Выйти
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard
