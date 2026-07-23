import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const SAMPLE = [
  { id: 'n1', title: 'Appointment Confirmed', body: 'Your cut with John is confirmed for tomorrow.', time: '2h', read: false },
  { id: 'n2', title: 'New Offer', body: 'Get 20% off on deluxe shaves this week.', time: '1d', read: false },
  { id: 'n3', title: 'Reminder', body: 'Don\'t forget your appointment next Monday.', time: '3d', read: true },
]

const Notifications = () => {
  const [items, setItems] = useState(SAMPLE)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 700)
  }, [])

  const toggleRead = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: !i.read } : i))
  }

  const clearAll = () => setItems([])

  const renderItem = ({ item }: { item: typeof SAMPLE[0] }) => (
    <TouchableOpacity style={[styles.row, item.read ? null : styles.unread]} onPress={() => toggleRead(item.id)}>
      <View style={styles.left}>
        {!item.read && <View style={styles.dot} />}
      </View>
      <View style={styles.mid}>
        <Text style={[styles.title, item.read ? styles.readText : null]} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.time}>{item.time}</Text>
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
        <TouchableOpacity onPress={clearAll} style={styles.clearBtn} accessibilityLabel="Clear all notifications">
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
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
