import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api, Barber, type Booking } from '@/src/lib/api';
import { useAuth } from '@/src/auth/AuthContext';
import '../global.css';

interface BookingHistory {
  id: string;
  barber: string;
  service: string;
  date: string;
  time: string;
  price: string;
  status: 'completed' | 'cancelled' | 'upcoming';
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'wallet'>('info');
  const { user: authUser, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
    const [barber, setBarber] = useState<Barber | null>(null);
  const [barberNames, setBarberNames] = useState<Record<string, string>>({});
 const [postDraft, setPostDraft] = useState({ status: "", mediaUrl: "", mediaType: "image" as "image" | "video" });
  const [posts, setPosts] = useState<Array<{ id: string; author: string; status: string; mediaUrl?: string; mediaType: "image" | "video"; createdAt: string }>>([]);


  useEffect(() => {
    Promise.all([api.getBookings(), api.getBarbers()]).then(([bookingResult, barberResult]) => {
      setBookings(bookingResult.bookings);
      setBarberNames(Object.fromEntries(barberResult.barbers.map((barber) => [barber.id, barber.name])));
    }).catch(() => {
      setBookings([]);
      setBarberNames({});
    });
  }, [authUser?.role]);

  const user = {
    name: authUser?.fullName ?? 'Stylish customer',
    email: authUser?.email ?? '',
    phone: authUser?.phone ?? 'Not provided',
    location: 'Tunis, Tunisia',
    avatar: 'https://picsum.photos/id/1005/200/200',
    memberSince: authUser ? new Date(authUser.createdAt).toLocaleDateString() : '',
    totalBookings: bookings.length,
  };
  useEffect(() => {
    if (!barber) return;

    setPosts((current) => {
      if (current.length > 0) return current;
      return [
        {
          id: "welcome-post",
          author: barber.name,
          status: "Fresh cuts, sharp fades, and clean lines. Book your next session today.",
          mediaUrl: barber.logoUrl,
          mediaType: "image",
          createdAt: "Today • 9:30 AM",
        },
      ];
    });
  }, [barber]);

  const createPost = () => {
    const status = postDraft.status.trim();
    if (!status && !postDraft.mediaUrl.trim()) {
      Alert.alert("Missing post", "Write a status or add a photo/video link before posting.");
      return;
    }

    const newPost = {
      id: `${Date.now()}`,
      author: barber?.name ?? "Your Studio",
      status,
      mediaUrl: postDraft.mediaUrl.trim() || undefined,
      mediaType: postDraft.mediaType,
      createdAt: "Just now",
    };

    setPosts((current) => [newPost, ...current]);
    setPostDraft({ status: "", mediaUrl: "", mediaType: "image" });
  };
  const bookingHistory: BookingHistory[] = bookings.map((booking) => ({
    id: booking.id,
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
    <ScrollView className="flex-1 bg-background">
      {/* Header - User Info */}
      <View className="bg-neutral-900 border-b-2 border-neutral-800 p-6">
        <View className="items-center">
          <Image
            source={{ uri: user.avatar }}
            className="w-24 h-24 rounded-full border-3 border-[#FFD60A] mb-4"
          />
          <Text className="text-white text-2xl font-PlayfairB">{user.name}</Text>
          <Text className="text-neutral-400 text-sm mt-1">Member since {user.memberSince}</Text>
        </View>

        {/* Upcoming Booking Alert */}
        {upcomingBooking && (
          <View className="bg-[#FFD60A]/20 border border-[#FFD60A] rounded-xl p-4 mt-6">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="event-note" size={20} color="#FFD60A" />
              <Text className="text-[#FFD60A] font-bold ml-2">You have an upcoming booking!</Text>
            </View>
            <View className="ml-7">
              <Text className="text-white font-semibold text-sm">{upcomingBooking.barber}</Text>
              <Text className="text-neutral-300 text-xs mt-1">{upcomingBooking.service}</Text>
              <View className="flex-row items-center mt-2 gap-2">
                <MaterialIcons name="access-time" size={14} color="#FFD60A" />
                <Text className="text-[#FFD60A] text-xs">
                  {new Date(upcomingBooking.date).toLocaleDateString()} • {upcomingBooking.time}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View className="flex-row justify-around mt-6 bg-black/40 rounded-xl p-4">
          <View className="items-center">
            <Text className="text-[#FFD60A] text-2xl font-bold">{user.totalBookings}</Text>
            <Text className="text-neutral-300 text-xs mt-1">Total Bookings</Text>
          </View>
          <View className="items-center">
            <Text className="text-[#FFD60A] text-2xl font-bold">325.50</Text>
            <Text className="text-neutral-300 text-xs mt-1">Total Spent</Text>
          </View>
          <View className="items-center">
            <Text className="text-[#FFD60A] text-2xl font-bold">12</Text>
            <Text className="text-neutral-300 text-xs mt-1">Saved Barbers</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-neutral-900 border-b border-neutral-800">
        <TouchableOpacity
          onPress={() => setActiveTab('info')}
          className={`flex-1 py-4 border-b-2 ${activeTab === 'info' ? 'border-[#FFD60A]' : 'border-transparent'}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'info' ? 'text-[#FFD60A]' : 'text-neutral-400'}`}>
            Info
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          className={`flex-1 py-4 border-b-2 ${activeTab === 'history' ? 'border-[#FFD60A]' : 'border-transparent'}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'history' ? 'text-[#FFD60A]' : 'text-neutral-400'}`}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('wallet')}
          className={`flex-1 py-4 border-b-2 ${activeTab === 'wallet' ? 'border-[#FFD60A]' : 'border-transparent'}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'wallet' ? 'text-[#FFD60A]' : 'text-neutral-400'}`}>
            Wallet
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View className="p-4">
        {/* Info Tab */}

        {activeTab === 'info' && (
          <View className="space-y-4">
            <View className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-5">
          <Text className="text-white text-xl font-PlayfairB mb-3">Activity</Text>

          <View className="bg-black/20 rounded-2xl border border-neutral-700 p-3">
            <TextInput
              className="text-white text-base"
              placeholder="Share a status update with your clients..."
              placeholderTextColor="#9ca3af"
              multiline
              value={postDraft.status}
              onChangeText={(status) => setPostDraft((current) => ({ ...current, status }))}
            />

            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                onPress={() => setPostDraft((current) => ({ ...current, mediaType: "image" }))}
                className={`flex-1 rounded-xl border px-3 py-2 ${postDraft.mediaType === "image" ? "border-[#FFD60A] bg-[#FFD60A]/10" : "border-neutral-700 bg-neutral-800"}`}
              >
                <Text className={`text-center text-sm font-semibold ${postDraft.mediaType === "image" ? "text-[#FFD60A]" : "text-neutral-300"}`}>
                  Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPostDraft((current) => ({ ...current, mediaType: "video" }))}
                className={`flex-1 rounded-xl border px-3 py-2 ${postDraft.mediaType === "video" ? "border-[#FFD60A] bg-[#FFD60A]/10" : "border-neutral-700 bg-neutral-800"}`}
              >
                <Text className={`text-center text-sm font-semibold ${postDraft.mediaType === "video" ? "text-[#FFD60A]" : "text-neutral-300"}`}>
                  Video
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              className="text-white text-sm mt-3"
              placeholder={postDraft.mediaType === "video" ? "Paste video URL..." : "Paste image URL..."}
              placeholderTextColor="#9ca3af"
              value={postDraft.mediaUrl}
              onChangeText={(mediaUrl) => setPostDraft((current) => ({ ...current, mediaUrl }))}
            />

            <TouchableOpacity onPress={createPost} className="bg-[#FFD60A] rounded-xl py-3 mt-4">
              <Text className="text-black text-center font-bold">Post update</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-white text-xl font-PlayfairB mb-3">Latest posts</Text>
        {posts.map((post) => (
          <View key={post.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-bold">{post.author}</Text>
              <Text className="text-neutral-500 text-xs">{post.createdAt}</Text>
            </View>

            {post.status ? <Text className="text-neutral-200 mt-3">{post.status}</Text> : null}

            {post.mediaUrl ? (
              post.mediaType === "video" ? (
                <View className="mt-3 bg-neutral-800 rounded-xl p-3 items-center justify-center">
                  <MaterialIcons name="videocam" size={28} color="#FFD60A" />
                  <Text className="text-neutral-300 text-xs mt-2">Video post</Text>
                  <Text className="text-neutral-500 text-[10px] mt-1">{post.mediaUrl}</Text>
                </View>
              ) : (
                <Image source={{ uri: post.mediaUrl }} className="w-full h-52 rounded-xl mt-3" resizeMode="cover" />
              )
            ) : null}
          </View>
        ))}
            <View className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="email" size={20} color="#FFD60A" />
                <Text className="text-neutral-400 text-sm ml-3 flex-1">Email</Text>
              </View>
              <Text className="text-white ml-8">{user.email}</Text>
            </View>

            <View className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="phone" size={20} color="#FFD60A" />
                <Text className="text-neutral-400 text-sm ml-3 flex-1">Phone</Text>
              </View>
              <Text className="text-white ml-8">{user.phone}</Text>
            </View>

            <View className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="location-on" size={20} color="#FFD60A" />
                <Text className="text-neutral-400 text-sm ml-3 flex-1">Location</Text>
              </View>
              <Text className="text-white ml-8">{user.location}</Text>
            </View>

            <TouchableOpacity className="bg-[#FFD60A] rounded-xl py-4 mt-6">
              <Text className="text-black text-center font-bold">Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={logout} className="bg-red-600/20 border border-red-600 rounded-xl py-4">
              <Text className="text-red-500 text-center font-bold">Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View className="space-y-3">
            {bookingHistory.length > 0 ? (
              bookingHistory.map((booking) => (
                <View
                  key={booking.id}
                  className="bg-neutral-900 rounded-xl p-4 border border-neutral-800"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{booking.barber}</Text>
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
        {activeTab === 'wallet' && (
          <View className="space-y-4">
            {/* Balance Card */}
            <View className="bg-gradient-to-r from-[#FFD60A] to-yellow-400 rounded-xl p-6">
              <Text className="text-black text-sm opacity-80 mb-2">Total Balance</Text>
              <Text className="text-black text-3xl font-PlayfairB">{wallet.balance}</Text>
              <Text className="text-black/60 text-sm mt-4">Total Spent: {wallet.totalSpent}</Text>
            </View>

            {/* Add Funds Button */}
            <TouchableOpacity className="bg-[#FFD60A] rounded-xl py-4">
              <View className="flex-row items-center justify-center gap-2">
                <MaterialIcons name="add" size={24} color="#000" />
                <Text className="text-black text-center font-bold">Add Funds</Text>
              </View>
            </TouchableOpacity>

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
                      className={`font-bold text-sm ${
                        transaction.type === 'spent' ? 'text-red-500' : 'text-green-500'
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