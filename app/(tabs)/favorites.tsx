import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { api, type Barber } from '@/src/lib/api'
import { useAuth } from '@/src/auth/AuthContext'
import BarberDashboard from '@/src/components/BarberDashboard'

const Favorites = () => {
  const { user, logout } = useAuth()
  const [items, setItems] = useState<Barber[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const loadFavorites = useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await api.getFavorites()
      setItems(result.barbers)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const fetchFavorites = async () => {
      if (user?.role === 'barber') return
      try {
        const result = await api.getFavorites()
        if (active) setItems(result.barbers)
      } catch {
        if (active) setItems([])
      }
    }

    void fetchFavorites()

    return () => {
      active = false
    }
  }, [user?.role])

  const onRefresh = useCallback(() => {
    void loadFavorites()
  }, [loadFavorites])

  const removeItem = async (id: string) => {
    await api.toggleFavorite(id)
    setItems(prev => prev.filter(item => item.id !== id))
  }

  if (user?.role === 'barber') {
    return <BarberDashboard onLogout={logout} />
  }

  const renderItem = ({ item }: { item: Barber }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.logoUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{item.location}</Text>
        <Text style={styles.price}>{item.rating.toFixed(1)} rating</Text>
        <View style={[styles.typePill, styles.barberPill]}>
          <Text style={styles.typeText}>Barber</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.heart} onPress={() => removeItem(item.id)} accessibilityLabel="Remove saved">
        <Ionicons name="trash" size={20} color="#e53935" />
      </TouchableOpacity>
    </View>
  )

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bookmark-outline" size={64} color="#bbb" />
        <Text style={styles.emptyTitle}>No saved items</Text>
        <Text style={styles.emptySub}>Save packs or barbers and they will appear here.</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/')}>
            <Text style={styles.exploreText}>Explore Services</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={i => i.id}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  image: { width: 72, height: 72, borderRadius: 8, marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  price: { fontSize: 13, color: '#222', marginTop: 6, fontWeight: '500' },
  heart: { padding: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 12, color: '#222' },
  emptySub: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  exploreBtn: { marginTop: 18, backgroundColor: '#111', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  exploreText: { color: '#fff', fontWeight: '600' },
  typePill: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  packPill: { backgroundColor: '#e8f4ff' },
  barberPill: { backgroundColor: '#f3f7e8' },
  typeText: { fontSize: 12, fontWeight: '600', color: '#444' },
})

export default Favorites
