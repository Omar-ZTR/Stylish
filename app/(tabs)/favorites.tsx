import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
const SAMPLE = [
  { id: '1', title: 'Starter Pack', subtitle: '3 services included', price: '$45', image: 'https://placekitten.com/200/200', type: 'pack' },
  { id: '2', title: 'John — Senior Barber', subtitle: 'Barber • 10 yrs experience', price: '', image: 'https://placekitten.com/201/200', type: 'barber' },
  { id: '3', title: 'Deluxe Shave Pack', subtitle: '2 services + product', price: '$30', image: 'https://placekitten.com/200/201', type: 'pack' },
]

const Favorites = () => {
  const [items, setItems] = useState(SAMPLE)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 700)
  }, [])

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const renderItem = ({ item }: { item: typeof SAMPLE[0] }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{item.subtitle}</Text>
        {item.price ? <Text style={styles.price}>{item.price}</Text> : null}
        <View style={[styles.typePill, item.type === 'pack' ? styles.packPill : styles.barberPill]}>
          <Text style={styles.typeText}>{item.type === 'pack' ? 'Pack' : 'Barber'}</Text>
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
