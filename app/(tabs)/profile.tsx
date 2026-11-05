import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api, Barber, type Booking } from '@/src/lib/api';
import { useAuth } from '@/src/auth/AuthContext';
import '../global.css';

const createPostId = () => `${Date.now()}`;

interface BookingHistory {
  id: string;
  barberId: string;
  barber: string;
  service: string;
  date: string;
  time: string;
  price: string;
  status: 'completed' | 'cancelled' | 'upcoming';
}

const Profile = () => {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const isBarber = authUser?.role === 'barber';
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'wallet' | 'gallery'>(() => isBarber ? 'gallery' : 'wallet');
  const displayedTab = !isBarber && activeTab === 'gallery' ? 'wallet' : activeTab;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [socialCount, setSocialCount] = useState(0);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [barberNames, setBarberNames] = useState<Record<string, string>>({});
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [posts, setPosts] = useState<{ id: string; author: string; status: string; mediaUrl?: string; mediaType: "image" | "video"; createdAt: string }[]>([]);

  useEffect(() => {
    Promise.all([api.getBookings(), api.getBarbers()]).then(([bookingResult, barberResult]) => {
      setBookings(bookingResult.bookings);
      setBarberNames(Object.fromEntries(barberResult.barbers.map((barber) => [barber.id, barber.name])));
    }).catch(() => {
      setBookings([]);
      setBarberNames({});
    });
  }, [authUser?.role]);

  useFocusEffect(useCallback(() => {
    let active = true;
    const loadSocialCount = async () => {
      try {
        if (isBarber) {
          const { barber: ownBarber } = await api.getMyBarber();
          if (!active) return;
          setBarber(ownBarber);
          const { followers } = await api.getBarberFollowerCount(ownBarber.id);
          if (active) setSocialCount(followers);
        } else {
          const { barbers } = await api.getFavorites();
          if (active) setSocialCount(barbers.length);
        }
      } catch {
        if (active) setSocialCount(0);
      }
    };

    void loadSocialCount();
    return () => { active = false; };
  }, [isBarber]));

  const user = {
    name: authUser?.fullName ?? 'Stylish customer',
    email: authUser?.email ?? '',
    phone: authUser?.phone ?? 'Not provided',
    location: 'Tunis, Tunisia',
    avatar: 'https://picsum.photos/id/1005/200/200',
    totalBookings: bookings.length,
  };
  const galleryPosts = posts.length > 0
    ? posts
    : barber
      ? [{
        id: "welcome-post",
        author: barber.name,
        status: "Fresh cuts, sharp fades, and clean lines. Book your next session today.",
        mediaUrl: barber.logoUrl,
        mediaType: "image" as const,
        createdAt: "Today • 9:30 AM",
      }]
      : [];

  const createPost = (mediaUrl: string, mediaType: "image" | "video") => {
    const newPost = {
      id: createPostId(),
      author: barber?.name ?? "Your Studio",
      status: "",
      mediaUrl,
      mediaType,
      createdAt: "Just now",
    };

    setPosts((current) => [newPost, ...current]);
  };

  const selectPostMedia = async (source: 'camera' | 'library', mediaType: 'image' | 'video') => {
    setShowPostOptions(false);

    try {
      const mediaTypes: ImagePicker.MediaType[] = mediaType === 'image' ? ['images'] : ['videos'];
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes, quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes, quality: 0.85 });

      if (!result.canceled && result.assets[0]) {
        createPost(result.assets[0].uri, mediaType);
      }
    } catch {
      Alert.alert('Unable to open media', 'Check camera or photo library permissions and try again.');
    }
  };
  const bookingHistory: BookingHistory[] = bookings.map((booking) => ({
    id: booking.id,
    barberId: booking.barberId,
    barber: barberNames[booking.barberId] ?? 'Barber',
    service: `${booking.serviceIds.length} service${booking.serviceIds.length === 1 ? '' : 's'}`,
    date: booking.bookingDate,
    time: booking.startTime,
    price: `${booking.totalPrice} TND`,
    status: booking.status === 'cancelled' ? 'cancelled' : booking.status === 'completed' ? 'completed' : 'upcoming',
  }));

  // Mock wallet data
  const wallet = {
    balance: '150.00 TND',
    totalSpent: '325.50 TND',
    transactions: [
      { id: '1', type: 'spent', description: 'Tony FadeMaster - Haircut', amount: '-45.00 TND', date: '2025-02-05' },
      { id: '2', type: 'refund', description: 'Cancelled Booking Refund', amount: '+25.00 TND', date: '2025-02-03' },
      { id: '3', type: 'spent', description: 'Barber House - Hair Coloring', amount: '-50.00 TND', date: '2025-01-28' },
      { id: '4', type: 'spent', description: 'Slim the Stylist - Modern Fade', amount: '-30.00 TND', date: '2025-01-20' },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'upcoming':
        return '#FFD60A';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'upcoming':
        return 'Upcoming';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Get upcoming booking
  const upcomingBooking = bookingHistory.find(b => b.status === 'upcoming');

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#24220f', '#171717', '#111111']} className="px-5 pt-6 pb-5 border-b border-[#FFD60A]/20">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[#FFD60A] text-[11px] font-bold tracking-widest">STYLISH / ACCOUNT</Text>
            <Text className="text-neutral-400 text-xs mt-1">Your personal space</Text>
          </View>
          <View className="flex-row items-center rounded-full border border-[#FFD60A]/30 bg-black/30 px-3 py-2">
            <MaterialIcons name={isBarber ? 'content-cut' : 'person-outline'} size={15} color="#FFD60A" />
            <Text className="text-[#FFD60A] text-xs font-bold ml-2">{isBarber ? 'BARBER' : 'MEMBER'}</Text>
          </View>
        </View>

        <View className="flex-row items-center mt-7">
          <View className="w-[76px] h-[76px] rounded-2xl border-2 border-[#FFD60A] p-1 bg-black/40">
            <Image source={{ uri: user.avatar }} className="w-full h-full rounded-xl" />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-neutral-400 text-xs">WELCOME BACK</Text>
            <Text className="text-white text-2xl font-PlayfairB mt-1" numberOfLines={1}>{user.name}</Text>
            <Text className="text-neutral-400 text-sm mt-1" numberOfLines={1}>{user.email}</Text>
          </View>
        </View>

        <View className="flex-row mt-6 pt-4 border-t border-white/10">
          <View className="flex-1">
            <Text className="text-[#FFD60A] text-2xl font-PlayfairB">{user.totalBookings}</Text>
            <Text className="text-neutral-400 text-[11px] mt-1">TOTAL BOOKINGS</Text>
          </View>
          <View className="flex-1 border-l border-white/10 pl-5">
            <Text className="text-[#FFD60A] text-2xl font-PlayfairB">{socialCount}</Text>
            <Text className="text-neutral-400 text-[11px] mt-1">{isBarber ? 'FOLLOWERS' : 'FOLLOWING'}</Text>
          </View>
          {isBarber && (
            <View className="flex-1 border-l border-white/10 pl-5">
              <Text className="text-[#FFD60A] text-2xl font-PlayfairB">{galleryPosts.length}</Text>
              <Text className="text-neutral-400 text-[11px] mt-1">GALLERY POSTS</Text>
            </View>
          )}
        </View>

        {upcomingBooking && (
          <TouchableOpacity
            onPress={() => router.push(`/barber/${upcomingBooking.barberId}`)}
            accessibilityRole="button"
            accessibilityLabel={`View ${upcomingBooking.barber}'s profile`}
            className="mt-5 flex-row items-center rounded-xl border border-[#FFD60A]/30 bg-black/35 p-3"
          >
            <View className="w-10 h-10 rounded-lg bg-[#FFD60A]/15 items-center justify-center">
              <MaterialIcons name="event-available" size={21} color="#FFD60A" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-[#FFD60A] text-[10px] font-bold tracking-wider">NEXT APPOINTMENT</Text>
              <Text className="mt-1 font-semibold text-white" numberOfLines={1}>{upcomingBooking.barber}</Text>
              <Text className="text-neutral-400 text-xs mt-1">{new Date(upcomingBooking.date).toLocaleDateString()} · {upcomingBooking.time}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#a3a3a3" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Tab Navigation */}
      <View className="flex-row bg-[#141414] border-b border-neutral-800 px-2">
        {/* <TouchableOpacity
          onPress={() => setActiveTab('info')}
          className={`flex-1 py-3 border-b-2 ${displayedTab === 'info' ? 'border-[#FFD60A]' : 'border-transparent'}`}
        >
          <View className="items-center"><MaterialIcons name="person-outline" size={18} color={displayedTab === 'info' ? '#FFD60A' : '#737373'} /><Text className={`text-[11px] font-semibold mt-1 ${displayedTab === 'info' ? 'text-[#FFD60A]' : 'text-neutral-400'}`}>Profile</Text></View>
        </TouchableOpacity> */}
        {isBarber && (
          <TouchableOpacity
            onPress={() => setActiveTab('gallery')}
            className={`flex-1 py-3 border-b-2 ${displayedTab === 'gallery' ? 'border-[#FFD60A]' : 'border-transparent'}`}
          >
            <View className="items-center">
              <MaterialIcons name="photo-library" size={18} color={displayedTab === 'gallery' ? '#FFD60A' : '#737373'} />
              <Text className={`text-[11px] font-semibold mt-1 ${displayedTab === 'gallery' ? 'text-[#FFD60A]' : 'text-neutral-400'}`}>Gallery</Text>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setActiveTab('wallet')}
          className={`flex-1 py-3 border-b-2 ${displayedTab === 'wallet' ? 'border-[#FFD60A]' : 'border-transparent'}`}
        >
          <View className="items-center"><MaterialIcons name="account-balance-wallet" size={18} color={displayedTab === 'wallet' ? '#FFD60A' : '#737373'} /><Text className={`text-[11px] font-semibold mt-1 ${displayedTab === 'wallet' ? 'text-[#FFD60A]' : 'text-neutral-400'}`}>Wallet</Text></View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          className={`flex-1 py-3 border-b-2 ${displayedTab === 'history' ? 'border-[#FFD60A]' : 'border-transparent'}`}
        >
          <View className="items-center"><MaterialIcons name="history" size={18} color={displayedTab === 'history' ? '#FFD60A' : '#737373'} /><Text className={`text-[11px] font-semibold mt-1 ${displayedTab === 'history' ? 'text-[#FFD60A]' : 'text-neutral-400'}`}>History</Text></View>
        </TouchableOpacity>

      </View>

      {/* Tab Content */}
      <View className="px-5 pt-5">
        {/* Info Tab */}

        {/* {displayedTab === 'info' && (
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            activeOpacity={0.85}
            className="flex-row items-center bg-neutral-900 rounded-2xl border border-neutral-800 p-4"
          >
            <View className="w-12 h-12 rounded-xl bg-[#FFD60A]/15 items-center justify-center">
              <MaterialIcons name="manage-accounts" size={24} color="#FFD60A" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white font-bold">Manage account</Text>
              <Text className="text-neutral-400 text-sm mt-1">Personal details and preferences</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#737373" />
          </TouchableOpacity>
        )} */}

        {isBarber && displayedTab === 'gallery' && (
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-PlayfairB">Gallery</Text>
              <Text className="text-neutral-400 text-sm">{galleryPosts.length} posts</Text>
            </View>

            <View className="mb-5">
              <TouchableOpacity
                onPress={() => setShowPostOptions(true)}
                className="flex-row items-center justify-center gap-2 bg-[#FFD60A] rounded-xl py-4"
              >
                <MaterialIcons name="add-a-photo" size={21} color="#000" />
                <Text className="text-black text-center font-bold">Share a post</Text>
              </TouchableOpacity>
            </View>

            {galleryPosts.length > 0 ? (
              <View className="flex-row flex-wrap justify-between">
                {galleryPosts.map((post) => (
                  <View key={post.id} className="w-[48%] mb-3 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                    {post.mediaUrl ? (
                      post.mediaType === 'video' ? (
                        <View className="h-36 items-center justify-center bg-neutral-800 px-2">
                          <MaterialIcons name="play-circle-filled" size={42} color="#FFD60A" />
                          <Text className="text-neutral-300 text-xs mt-2">Video</Text>
                          <Text className="text-neutral-500 text-[10px] mt-1" numberOfLines={1}>{post.mediaUrl}</Text>
                        </View>
                      ) : (
                        <Image source={{ uri: post.mediaUrl }} className="w-full h-36" resizeMode="cover" />
                      )
                    ) : (
                      <View className="h-36 items-center justify-center bg-neutral-800 p-3">
                        <MaterialIcons name="notes" size={28} color="#FFD60A" />
                        <Text className="text-neutral-300 text-xs mt-2" numberOfLines={4}>{post.status}</Text>
                      </View>
                    )}
                    <View className="p-3">
                      <Text className="text-white text-sm font-semibold" numberOfLines={2}>{post.status || post.author}</Text>
                      <Text className="text-neutral-500 text-xs mt-2">{post.createdAt}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-10">
                <MaterialIcons name="photo-library" size={42} color="#737373" />
                <Text className="text-neutral-400 text-center mt-3">Photos and videos will appear here.</Text>
              </View>
            )}

            <Modal
              visible={showPostOptions}
              transparent
              animationType="slide"
              onRequestClose={() => setShowPostOptions(false)}
            >
              <View className="flex-1 justify-end bg-black/70">
                <TouchableOpacity
                  className="absolute inset-0"
                  activeOpacity={1}
                  onPress={() => setShowPostOptions(false)}
                />
                <View className="bg-neutral-900 rounded-t-2xl border-t border-neutral-700 p-5">
                  <Text className="text-white text-lg font-PlayfairB mb-4">Share a post</Text>
                  <View className="flex-row flex-wrap justify-between">
                    {[
                      { label: 'Take photo', icon: 'photo-camera', source: 'camera', mediaType: 'image' },
                      { label: 'Record video', icon: 'videocam', source: 'camera', mediaType: 'video' },
                      { label: 'Choose photo', icon: 'photo-library', source: 'library', mediaType: 'image' },
                      { label: 'Choose video', icon: 'video-library', source: 'library', mediaType: 'video' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.label}
                        onPress={() => void selectPostMedia(option.source as 'camera' | 'library', option.mediaType as 'image' | 'video')}
                        className="w-[48%] flex-row items-center bg-neutral-800 rounded-lg border border-neutral-700 p-3 mb-3"
                      >
                        <MaterialIcons name={option.icon as keyof typeof MaterialIcons.glyphMap} size={22} color="#FFD60A" />
                        <Text className="text-white text-sm font-semibold ml-2">{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => setShowPostOptions(false)} className="py-3 mt-1">
                    <Text className="text-neutral-300 text-center font-semibold">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        )}

        {/* History Tab */}
        {displayedTab === 'history' && (
          <View className="space-y-3">
            {bookingHistory.length > 0 ? (
              bookingHistory.map((booking) => (
                <View
                  key={booking.id}
                  className="bg-neutral-900 rounded-xl p-4 border border-neutral-800"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <TouchableOpacity
                        onPress={() => router.push(`/barber/${booking.barberId}`)}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${booking.barber}'s profile`}
                        className="self-start"
                      >
                        <Text className="font-semibold text-white">{booking.barber}</Text>
                      </TouchableOpacity>
                      <Text className="text-neutral-400 text-sm mt-1">{booking.service}</Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: getStatusColor(booking.status) + '20',
                        borderColor: getStatusColor(booking.status),
                      }}
                      className="px-3 py-1 rounded-full border"
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: getStatusColor(booking.status) }}
                      >
                        {getStatusText(booking.status)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <MaterialIcons name="access-time" size={16} color="#FFD60A" />
                      <Text className="text-neutral-400 text-sm">
                        {new Date(booking.date).toLocaleDateString()} • {booking.time}
                      </Text>
                    </View>
                    <Text className="text-[#FFD60A] font-bold">{booking.price}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center justify-center py-8">
                <MaterialIcons name="history" size={48} color="#666" />
                <Text className="text-neutral-400 text-center mt-3">No booking history yet</Text>
              </View>
            )}
          </View>
        )}

        {/* Wallet Tab */}
        {displayedTab === 'wallet' && (
          <View className="space-y-4">
            {/* Balance Card */}
            <LinearGradient colors={['#282516', '#171717', '#101010']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-2xl border border-[#FFD60A]/35 p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-[#FFD60A]/15 items-center justify-center">
                    <MaterialIcons name="account-balance-wallet" size={21} color="#FFD60A" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-bold">Stylish Wallet</Text>
                    <Text className="text-neutral-500 text-[10px] tracking-widest mt-1">PERSONAL BALANCE</Text>
                  </View>
                </View>
                <MaterialIcons name="more-horiz" size={24} color="#a3a3a3" />
              </View>

              <View className="mt-7">
                <Text className="text-neutral-400 text-xs">Available balance</Text>
                <Text className="text-white text-4xl font-PlayfairB mt-2">{wallet.balance}</Text>
              </View>

              <View className="flex-row items-center justify-between border-t border-white/10 mt-6 pt-4">
                <View>
                  <Text className="text-neutral-500 text-[10px] tracking-wider">TOTAL SPENT</Text>
                  <Text className="text-[#FFD60A] text-base font-bold mt-1">{wallet.totalSpent}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.8} className="flex-row items-center bg-[#FFD60A] rounded-xl px-4 py-3">
                  <MaterialIcons name="add" size={19} color="#111" />
                  <Text className="text-black font-bold ml-1">Add funds</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>



            {/* Transactions */}
            <View>
              <Text className="text-white text-lg font-PlayfairB mb-3">Recent Transactions</Text>
              <View className="space-y-2">
                {wallet.transactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 flex-row justify-between items-center"
                  >
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{transaction.description}</Text>
                      <Text className="text-neutral-500 text-xs mt-1">{transaction.date}</Text>
                    </View>
                    <Text
                      className={`font-bold text-sm ${transaction.type === 'spent' ? 'text-red-500' : 'text-green-500'
                        }`}
                    >
                      {transaction.amount}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default Profile;