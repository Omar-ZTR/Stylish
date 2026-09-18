import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { api, type Notification as ApiNotification } from '@/src/lib/api'
import { useAuth } from '@/src/auth/AuthContext'
import BarberBookings from '@/src/components/BarberBookings'

const Notifications = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<ApiNotification[]>([])
  const [refreshing, setRefreshing] = useState(false)

  if (user?.role === 'barber') return <BarberBookings />

  const loadNotifications = useCallback(async () => {
    setRefreshing(true)
    try { setItems((await api.getNotifications()).notifications) } finally { setRefreshing(false) }
  }, [])

  useEffect(() => {
    let active = true

    const fetchNotifications = async () => {
      try {
        const result = await api.getNotifications()
        if (active) setItems(result.notifications)
      } catch {
        if (active) setItems([])
      }
    }

    void fetchNotifications()

    return () => {
      active = false
    }
  }, [])

  const onRefresh = useCallback(() => { void loadNotifications() }, [loadNotifications])

  const toggleRead = async (id: string) => {
    await api.markNotificationRead(id)
    setItems(prev => prev.map(item => item.id === id ? { ...item, isRead: true } : item))
  }

  const renderItem = ({ item }: { item: ApiNotification }) => (
    <TouchableOpacity style={[styles.row, item.isRead ? null : styles.unread]} onPress={() => toggleRead(item.id)}>
      <View style={styles.left}>
        {!item.isRead && <View style={styles.dot} />}
      </View>
      <View style={styles.mid}>
        <Text style={[styles.title, item.isRead ? styles.readText : null]} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  )

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={64} color="#bbb" />
        <Text style={styles.emptyTitle}>No notifications</Text>
        <Text style={styles.emptySub}>You&apos;re all caught up.</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.clearText}>{items.filter(item => !item.isRead).length} unread</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingTop: 18 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  clearBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  clearText: { color: '#e53935', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, elevation: 1 },
  unread: { backgroundColor: '#f8fbff' },
  left: { width: 24, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 6, backgroundColor: '#1e88e5' },
  mid: { flex: 1, paddingRight: 8 },
  right: { width: 48, alignItems: 'flex-end' },
  title: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 13, color: '#666', marginTop: 4 },
  time: { fontSize: 12, color: '#999' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#888', marginTop: 8 },
  readText: { color: '#777', fontWeight: '500' },
})

export default Notifications
