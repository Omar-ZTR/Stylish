import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Image, Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api, type Barber, type Service } from "@/src/lib/api";

type ServiceForm = { name: string; durationMinutes: string; price: string };
const emptyService: ServiceForm = { name: "", durationMinutes: "30", price: "25" };

export default function BarberDashboard({ onLogout }: { onLogout: () => void }) {
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", location: "", startTime: "09:00", endTime: "19:00", pauseStartTime: "13:00", pauseEndTime: "14:00" });
  const [pauseEnabled, setPauseEnabled] = useState(false);
  const [serviceForm, setServiceForm] = useState<ServiceForm>(emptyService);

  const loadBarber = async () => {
    try {
      const result = await api.getMyBarber();
      setBarber(result.barber);
      setProfileForm({ name: result.barber.name, location: result.barber.location, startTime: result.barber.startTime, endTime: result.barber.endTime, pauseStartTime: result.barber.pauseStartTime ?? "13:00", pauseEndTime: result.barber.pauseEndTime ?? "14:00" });
      setPauseEnabled(Boolean(result.barber.pauseStartTime && result.barber.pauseEndTime));
    } catch (error) {
      Alert.alert("Could not load profile", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { void loadBarber(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const openNewService = () => {
    setEditingService(null);
    setServiceForm(emptyService);
    setShowServiceEditor(true);
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({ name: service.name, durationMinutes: String(service.durationMinutes), price: String(service.price) });
    setShowServiceEditor(true);
  };

  const saveProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.location.trim()) return Alert.alert("Missing details", "Add a business name and location.");
    setSaving(true);
    try {
      const result = await api.updateMyBarber({ ...profileForm, name: profileForm.name.trim(), location: profileForm.location.trim(), ...(pauseEnabled ? {} : { pauseStartTime: undefined, pauseEndTime: undefined }) });
      setBarber(result.barber);
      setShowProfileEditor(false);
    } catch (error) {
      Alert.alert("Could not save profile", error instanceof Error ? error.message : "Please try again.");
    } finally { setSaving(false); }
  };

  const saveService = async () => {
    const durationMinutes = Number(serviceForm.durationMinutes);
    const price = Number(serviceForm.price);
    if (!serviceForm.name.trim() || !Number.isFinite(durationMinutes) || durationMinutes <= 0 || !Number.isFinite(price) || price < 0) {
      return Alert.alert("Invalid service", "Enter a name, a positive duration, and a valid price.");
    }
    setSaving(true);
    try {
      if (editingService) await api.updateMyService(editingService.id, { name: serviceForm.name.trim(), durationMinutes, price });
      else await api.createMyService({ name: serviceForm.name.trim(), durationMinutes, price });
      await loadBarber();
      setShowServiceEditor(false);
    } catch (error) {
      Alert.alert("Could not save service", error instanceof Error ? error.message : "Please try again.");
    } finally { setSaving(false); }
  };

  const deleteService = (service: Service) => Alert.alert("Remove service", `Remove ${service.name} from your menu?`, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: async () => {
      try { await api.deleteMyService(service.id); await loadBarber(); }
      catch (error) { Alert.alert("Could not remove service", error instanceof Error ? error.message : "Please try again."); }
    } },
  ]);

  if (loading) return <View className="flex-1 bg-background items-center justify-center"><Text className="text-neutral-400">Loading your barber profile...</Text></View>;
  if (!barber) return <View className="flex-1 bg-background items-center justify-center p-6"><Text className="text-white text-lg font-bold text-center">Your barber profile is unavailable.</Text><TouchableOpacity onPress={() => void loadBarber()} className="bg-[#FFD60A] rounded-xl px-6 py-3 mt-4"><Text className="text-black font-bold">Try again</Text></TouchableOpacity></View>;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="bg-neutral-900 px-5 pt-6 pb-5 border-b border-neutral-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[#FFD60A] text-xs font-bold tracking-widest">BARBER STUDIO</Text>
            <Text className="text-white text-3xl font-PlayfairB mt-2">{barber.name}</Text>
            <Text className="text-neutral-400 mt-1">{barber.location}</Text>
          </View>
          <Image source={{ uri: barber.logoUrl }} className="w-20 h-20 rounded-2xl border-2 border-[#FFD60A]" />
        </View>
        <View className="flex-row mt-5 gap-3">
          <View className="flex-1 bg-black/30 rounded-xl p-3"><Text className="text-[#FFD60A] text-xl font-bold">{barber.services.length}</Text><Text className="text-neutral-400 text-xs mt-1">Active services</Text></View>
          <View className="flex-1 bg-black/30 rounded-xl p-3"><Text className="text-[#FFD60A] text-xl font-bold">{barber.startTime}</Text><Text className="text-neutral-400 text-xs mt-1">Opens today</Text></View>
          <View className="flex-1 bg-black/30 rounded-xl p-3"><Text className="text-[#FFD60A] text-xl font-bold">{barber.endTime}</Text><Text className="text-neutral-400 text-xs mt-1">Closes today</Text></View>
        </View>
      </View>

      <View className="px-4 pt-5">
        <View className="flex-row items-center justify-between mb-3"><View><Text className="text-white text-xl font-PlayfairB">Your services</Text><Text className="text-neutral-400 text-sm mt-1">Keep your menu clear and up to date.</Text></View><TouchableOpacity onPress={openNewService} className="bg-[#FFD60A] rounded-xl p-3"><MaterialIcons name="add" size={23} color="#000" /></TouchableOpacity></View>
        {barber.services.length === 0 ? <View className="bg-neutral-900 rounded-2xl border border-dashed border-neutral-700 p-7 items-center"><MaterialIcons name="content-cut" size={36} color="#FFD60A" /><Text className="text-white font-bold mt-3">Your menu is empty</Text><Text className="text-neutral-400 text-center text-sm mt-1">Add your first service so clients can book you.</Text><TouchableOpacity onPress={openNewService} className="bg-[#FFD60A] rounded-xl px-5 py-3 mt-4"><Text className="text-black font-bold">Add first service</Text></TouchableOpacity></View> : barber.services.map((service) => <View key={service.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-3 mb-3 flex-row items-center"><Image source={{ uri: service.imageUrl }} className="w-16 h-16 rounded-xl" /><View className="flex-1 ml-3"><Text className="text-white font-bold">{service.name}</Text><Text className="text-neutral-400 text-sm mt-1">{service.durationMinutes} min</Text><Text className="text-[#FFD60A] font-bold mt-1">{service.price} TND</Text></View><TouchableOpacity onPress={() => openEditService(service)} className="p-2"><MaterialIcons name="edit" size={20} color="#FFD60A" /></TouchableOpacity><TouchableOpacity onPress={() => deleteService(service)} className="p-2"><MaterialIcons name="delete-outline" size={22} color="#ef4444" /></TouchableOpacity></View>)}

        <Text className="text-white text-xl font-PlayfairB mt-5 mb-3">Shop profile</Text>
        <View className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4"><Text className="text-neutral-400 text-xs">OPENING HOURS</Text><Text className="text-white font-bold mt-1">{barber.startTime} - {barber.endTime}</Text>{barber.pauseStartTime && barber.pauseEndTime ? <><Text className="text-neutral-400 text-xs mt-3">BREAK</Text><Text className="text-white font-bold mt-1">{barber.pauseStartTime} - {barber.pauseEndTime}</Text></> : null}<Text className="text-neutral-400 text-xs mt-4">LOCATION</Text><Text className="text-white font-bold mt-1">{barber.location}</Text><TouchableOpacity onPress={() => setShowProfileEditor(true)} className="border border-[#FFD60A] rounded-xl py-3 mt-4"><Text className="text-[#FFD60A] text-center font-bold">Edit shop profile</Text></TouchableOpacity></View>
        <TouchableOpacity onPress={onLogout} className="bg-red-600/15 border border-red-500/50 rounded-xl py-4 mt-6"><Text className="text-red-400 text-center font-bold">Log out</Text></TouchableOpacity>
      </View>

      <Modal visible={showProfileEditor} transparent animationType="slide" onRequestClose={() => setShowProfileEditor(false)}><View className="flex-1 bg-black/60 justify-end"><View className="bg-neutral-900 rounded-t-3xl p-5"><Text className="text-white text-2xl font-PlayfairB">Edit shop profile</Text><TextInput className="bg-neutral-800 rounded-xl px-4 py-3 text-white mt-5" placeholder="Business name" placeholderTextColor="#9ca3af" value={profileForm.name} onChangeText={(name) => setProfileForm({ ...profileForm, name })} /><TextInput className="bg-neutral-800 rounded-xl px-4 py-3 text-white mt-3" placeholder="Location" placeholderTextColor="#9ca3af" value={profileForm.location} onChangeText={(location) => setProfileForm({ ...profileForm, location })} /><View className="flex-row gap-3 mt-3"><TextInput className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 text-white" placeholder="09:00" placeholderTextColor="#9ca3af" value={profileForm.startTime} onChangeText={(startTime) => setProfileForm({ ...profileForm, startTime })} /><TextInput className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 text-white" placeholder="19:00" placeholderTextColor="#9ca3af" value={profileForm.endTime} onChangeText={(endTime) => setProfileForm({ ...profileForm, endTime })} /></View><View className="flex-row items-center justify-between mt-4"><View><Text className="text-white font-bold">Add a break</Text><Text className="text-neutral-400 text-xs mt-1">Optional pause during the day</Text></View><Switch value={pauseEnabled} onValueChange={setPauseEnabled} trackColor={{ false: "#374151", true: "#f59e0b" }} thumbColor="#fff" /></View>{pauseEnabled ? <View className="flex-row gap-3 mt-3"><TextInput className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 text-white" placeholder="13:00" placeholderTextColor="#9ca3af" value={profileForm.pauseStartTime} onChangeText={(pauseStartTime) => setProfileForm({ ...profileForm, pauseStartTime })} /><TextInput className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 text-white" placeholder="14:00" placeholderTextColor="#9ca3af" value={profileForm.pauseEndTime} onChangeText={(pauseEndTime) => setProfileForm({ ...profileForm, pauseEndTime })} /></View> : null}<View className="flex-row gap-3 mt-5"><TouchableOpacity onPress={() => setShowProfileEditor(false)} className="flex-1 border border-neutral-700 rounded-xl py-4"><Text className="text-neutral-300 text-center font-bold">Cancel</Text></TouchableOpacity><TouchableOpacity disabled={saving} onPress={() => void saveProfile()} className="flex-1 bg-[#FFD60A] rounded-xl py-4"><Text className="text-black text-center font-bold">{saving ? "Saving..." : "Save changes"}</Text></TouchableOpacity></View></View></View></Modal>
      <Modal visible={showServiceEditor} transparent animationType="slide" onRequestClose={() => setShowServiceEditor(false)}><View className="flex-1 bg-black/60 justify-end"><View className="bg-neutral-900 rounded-t-3xl p-5"><Text className="text-white text-2xl font-PlayfairB">{editingService ? "Edit service" : "New service"}</Text><TextInput className="bg-neutral-800 rounded-xl px-4 py-3 text-white mt-5" placeholder="Service name" placeholderTextColor="#9ca3af" value={serviceForm.name} onChangeText={(name) => setServiceForm({ ...serviceForm, name })} /><View className="flex-row gap-3 mt-3"><TextInput className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 text-white" placeholder="Duration (min)" placeholderTextColor="#9ca3af" keyboardType="numeric" value={serviceForm.durationMinutes} onChangeText={(durationMinutes) => setServiceForm({ ...serviceForm, durationMinutes })} /><TextInput className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 text-white" placeholder="Price (TND)" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" value={serviceForm.price} onChangeText={(price) => setServiceForm({ ...serviceForm, price })} /></View><View className="flex-row gap-3 mt-5"><TouchableOpacity onPress={() => setShowServiceEditor(false)} className="flex-1 border border-neutral-700 rounded-xl py-4"><Text className="text-neutral-300 text-center font-bold">Cancel</Text></TouchableOpacity><TouchableOpacity disabled={saving} onPress={() => void saveService()} className="flex-1 bg-[#FFD60A] rounded-xl py-4"><Text className="text-black text-center font-bold">{saving ? "Saving..." : "Save service"}</Text></TouchableOpacity></View></View></View></Modal>
    </ScrollView>
  );
}