import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Image, Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import TimeWheelPicker from "@/src/components/booking/TimeWheelPicker";
import { api, type Barber, type Service } from "@/src/lib/api";

type ServiceForm = { name: string; durationMinutes: string; price: string; imageUrl?: string };
const emptyService: ServiceForm = { name: "", durationMinutes: "30", price: "25" };
const serviceCatalog = [
  { name: "Classic Haircut", imageUrl: "https://picsum.photos/id/1005/300/400" },
  { name: "Beard Trim", imageUrl: "https://picsum.photos/id/1011/300/400" },
  { name: "Hair Wash", imageUrl: "https://picsum.photos/id/1027/300/400" },
  { name: "Modern Fade", imageUrl: "https://picsum.photos/id/1033/300/400" },
  { name: "Hot Towel Shave", imageUrl: "https://picsum.photos/id/1040/300/400" },
  { name: "Kids Cut", imageUrl: "https://picsum.photos/id/1052/300/400" },
  { name: "Hair Coloring", imageUrl: "https://picsum.photos/id/1060/300/400" },
];

export default function BarberDashboard({ onLogout }: { onLogout: () => void }) {
  const [barber, setBarber] = useState<Barber | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
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
      try {
        const { followers } = await api.getBarberFollowerCount(result.barber.id);
        setFollowerCount(followers);
      } catch {
        setFollowerCount(0);
      }
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
    setServiceForm({
      name: service.name,
      durationMinutes: String(service.durationMinutes),
      price: String(service.price),
      imageUrl: service.imageUrl,
    });
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

  const renderTimeField = (field: "startTime" | "endTime" | "pauseStartTime" | "pauseEndTime", label: string) => (
    <View className="flex-1">
      <Text className="text-neutral-400 text-xs font-semibold mb-2">{label}</Text>
      <TimeWheelPicker
        value={profileForm[field]}
        label={label}
        compact
        onConfirm={(value) => setProfileForm((current) => ({ ...current, [field]: value }))}
      />
    </View>
  );

  const saveService = async () => {
    const durationMinutes = Number(serviceForm.durationMinutes);
    const price = Number(serviceForm.price);
    if (!serviceForm.name.trim() || !Number.isFinite(durationMinutes) || durationMinutes <= 0 || !Number.isFinite(price) || price < 0) {
      return Alert.alert("Invalid service", "Enter a name, a positive duration, and a valid price.");
    }
    setSaving(true);
    try {
      const serviceData = {
        name: serviceForm.name.trim(),
        durationMinutes,
        price,
        ...(serviceForm.imageUrl ? { imageUrl: serviceForm.imageUrl } : {}),
      };
      if (editingService) await api.updateMyService(editingService.id, serviceData);
      else await api.createMyService(serviceData);
      await loadBarber();
      setShowServiceEditor(false);
    } catch (error) {
      Alert.alert("Could not save service", error instanceof Error ? error.message : "Please try again.");
    } finally { setSaving(false); }
  };

  const deleteService = (service: Service) => Alert.alert("Remove service", `Remove ${service.name} from your menu?`, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Remove", style: "destructive", onPress: async () => {
        try { await api.deleteMyService(service.id); await loadBarber(); }
        catch (error) { Alert.alert("Could not remove service", error instanceof Error ? error.message : "Please try again."); }
      }
    },
  ]);

  if (loading) return <View className="flex-1 bg-background items-center justify-center"><Text className="text-neutral-400">Loading your barber profile...</Text></View>;
  if (!barber) return <View className="flex-1 bg-background items-center justify-center p-6"><Text className="text-white text-lg font-bold text-center">Your barber profile is unavailable.</Text><TouchableOpacity onPress={() => void loadBarber()} className="bg-[#FFD60A] rounded-xl px-6 py-3 mt-4"><Text className="text-black font-bold">Try again</Text></TouchableOpacity></View>;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="bg-neutral-900 px-5 pt-6 pb-5 border-b border-neutral-800">
        <View className="flex-row mt-5 gap-3">
          {barber.pauseStartTime && barber.pauseEndTime ? <><View className="flex-1 bg-black/30 rounded-xl p-3"><Text className="text-[#FFD60A] text-xl font-bold">{barber.pauseStartTime} - {barber.pauseEndTime}</Text><Text className="text-neutral-400 text-xs mt-1">Break</Text></View></> : null}
          <View className="flex-1 bg-black/30 rounded-xl p-3"><Text className="text-[#FFD60A] text-xl font-bold">{barber.startTime}</Text><Text className="text-neutral-400 text-xs mt-1">Opens today</Text></View>
          <View className="flex-1 bg-black/30 rounded-xl p-3"><Text className="text-[#FFD60A] text-xl font-bold">{barber.endTime}</Text><Text className="text-neutral-400 text-xs mt-1">Closes today</Text></View>
        </View>
        <View>
          <TouchableOpacity onPress={() => setShowProfileEditor(true)} className="border border-[#FFD60A] rounded-xl py-3 mt-4">
          <Text className="text-[#FFD60A] text-center font-bold">Edit shop profile</Text>
        </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 pt-5">
        <View className="flex-row items-center bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-5 overflow-hidden">
          <View className="w-12 h-12 items-center justify-center rounded-2xl bg-[#FFD60A]/10 border border-[#FFD60A]/20">
            <MaterialIcons name="content-cut" size={23} color="#FFD60A" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-neutral-400 text-[10px] font-bold tracking-widest">YOUR MENU</Text>
            <View className="flex-row items-baseline mt-0.5">
              <Text className="text-white text-2xl font-bold">{barber.services.length}</Text>
              <Text className="text-neutral-400 text-xs ml-2">
                {barber.services.length === 1 ? "active service" : "active services"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={openNewService}
            accessibilityRole="button"
            accessibilityLabel="Add a new service"
            activeOpacity={0.8}
            className="flex-col items-center bg-[#FFD60A] rounded-xl p-3"
          >
            <MaterialIcons name="add" size={20} color="#111111" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white text-2xl font-PlayfairB">Your services</Text>
            <Text className="text-neutral-400 text-sm mt-1">Make every appointment count.</Text>
          </View>
          <View className="h-1 w-10 rounded-full bg-[#FFD60A] mt-5" />
        </View>
        {barber.services.length === 0 ? <View className="bg-neutral-900 rounded-2xl border border-dashed border-neutral-700 p-7 items-center"><MaterialIcons name="content-cut" size={36} color="#FFD60A" /><Text className="text-white font-bold mt-3">Your menu is empty</Text><Text className="text-neutral-400 text-center text-sm mt-1">Add your first service so clients can book you.</Text><TouchableOpacity onPress={openNewService} className="bg-[#FFD60A] rounded-xl px-5 py-3 mt-4"><Text className="text-black font-bold">Add first service</Text></TouchableOpacity></View> : barber.services.map((service) => <View key={service.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-3 mb-3 flex-row items-center"><Image source={{ uri: service.imageUrl }} className="w-16 h-16 rounded-xl" /><View className="flex-1 ml-3"><Text className="text-white font-bold">{service.name}</Text><Text className="text-neutral-400 text-sm mt-1">{service.durationMinutes} min</Text><Text className="text-[#FFD60A] font-bold mt-1">{service.price} TND</Text></View><TouchableOpacity onPress={() => openEditService(service)} className="p-2"><MaterialIcons name="edit" size={20} color="#FFD60A" /></TouchableOpacity><TouchableOpacity onPress={() => deleteService(service)} className="p-2"><MaterialIcons name="delete-outline" size={22} color="#ef4444" /></TouchableOpacity></View>)}



        </View>

      <Modal
        visible={showProfileEditor}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileEditor(false)}
      >
        <View className="flex-1 justify-end bg-black/70">
          <View className="max-h-[90%] rounded-t-3xl border-t border-neutral-700 bg-neutral-950 px-5 pt-3 pb-8">
            <View className="self-center w-10 h-1 rounded-full bg-neutral-700 mb-5" />
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 items-center justify-center rounded-2xl bg-[#FFD60A]/10 border border-[#FFD60A]/20">
                  <MaterialIcons name="storefront" size={23} color="#FFD60A" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white text-2xl font-PlayfairB">Shop profile</Text>
                  <Text className="text-neutral-400 text-sm mt-0.5">Keep your business details up to date.</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowProfileEditor(false)}
                accessibilityRole="button"
                accessibilityLabel="Close shop profile editor"
                className="w-10 h-10 items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 ml-2"
              >
                <MaterialIcons name="close" size={20} color="#d4d4d4" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <View className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                <View className="flex-row items-center mb-4">
                  <MaterialIcons name="badge" size={18} color="#FFD60A" />
                  <Text className="text-white font-bold ml-2">Business details</Text>
                </View>
                <Text className="text-neutral-400 text-xs font-semibold mb-2">BUSINESS NAME</Text>
                <TextInput
                  className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3.5 text-white"
                  placeholder="Your shop name"
                  placeholderTextColor="#737373"
                  value={profileForm.name}
                  onChangeText={(name) => setProfileForm({ ...profileForm, name })}
                  returnKeyType="next"
                />
                <Text className="text-neutral-400 text-xs font-semibold mt-4 mb-2">LOCATION</Text>
                <View className="flex-row items-center bg-neutral-800 border border-neutral-700 rounded-xl px-3">
                  <MaterialIcons name="location-on" size={18} color="#FFD60A" />
                  <TextInput
                    className="flex-1 px-2 py-3.5 text-white"
                    placeholder="Street, area or city"
                    placeholderTextColor="#737373"
                    value={profileForm.location}
                    onChangeText={(location) => setProfileForm({ ...profileForm, location })}
                    returnKeyType="done"
                  />
                </View>
              </View>

              <View className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 mt-4">
                <View className="flex-row items-center mb-4">
                  <MaterialIcons name="schedule" size={18} color="#FFD60A" />
                  <Text className="text-white font-bold ml-2">Opening hours</Text>
                </View>
                <View className="flex-row items-center">
                  {renderTimeField("startTime", "OPENS")}
                  <MaterialIcons name="east" size={18} color="#737373" style={{ marginHorizontal: 12, marginTop: 22 }} />
                  {renderTimeField("endTime", "CLOSES")}
                </View>

                <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-neutral-800">
                  <View className="flex-row items-center flex-1">
                    <View className="w-9 h-9 items-center justify-center rounded-xl bg-[#FFD60A]/10">
                      <MaterialIcons name="free-breakfast" size={18} color="#FFD60A" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-white font-semibold">Daily break</Text>
                      <Text className="text-neutral-500 text-xs mt-0.5">Add an optional pause</Text>
                    </View>
                  </View>
                  <Switch
                    value={pauseEnabled}
                    onValueChange={setPauseEnabled}
                    trackColor={{ false: "#374151", true: "#a87900" }}
                    thumbColor={pauseEnabled ? "#FFD60A" : "#d1d5db"}
                  />
                </View>

                {pauseEnabled ? (
                  <View className="flex-row gap-3 mt-4">
                    {renderTimeField("pauseStartTime", "BREAK START")}
                    {renderTimeField("pauseEndTime", "BREAK END")}
                  </View>
                ) : null}
              </View>

              <View className="flex-row gap-3 mt-5">
                <TouchableOpacity
                  onPress={() => setShowProfileEditor(false)}
                  activeOpacity={0.75}
                  className="flex-1 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 py-4"
                >
                  <Text className="text-neutral-300 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={saving}
                  onPress={() => void saveProfile()}
                  activeOpacity={0.82}
                  className={`flex-1 items-center justify-center rounded-xl py-4 ${saving ? "bg-[#FFD60A]/50" : "bg-[#FFD60A]"}`}
                >
                  <Text className="text-black font-bold">{saving ? "Saving..." : "Save profile"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={showServiceEditor} transparent animationType="slide" onRequestClose={() => setShowServiceEditor(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="max-h-[88%] bg-neutral-900 rounded-t-3xl border-t border-neutral-800 px-5 pt-5 pb-8">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-2xl font-PlayfairB">{editingService ? "Edit service" : "New service"}</Text>
                <Text className="text-neutral-400 text-sm mt-1">
                  {editingService ? "Update your service details." : "Choose a service, then set its price and duration."}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowServiceEditor(false)} accessibilityLabel="Close service editor" className="p-2 rounded-full bg-neutral-800">
                <MaterialIcons name="close" size={20} color="#d4d4d4" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {!editingService ? (
                <>
                  <Text className="text-white font-bold mb-3">Choose a service</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5">
                    <View className="flex-row px-5 pb-2">
                      {serviceCatalog.map((service) => {
                        const selected = serviceForm.imageUrl === service.imageUrl;
                        return (
                          <TouchableOpacity
                            key={service.name}
                            onPress={() => setServiceForm({ ...serviceForm, name: service.name, imageUrl: service.imageUrl })}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            className={`w-28 mr-3 overflow-hidden rounded-2xl border ${selected ? "border-[#FFD60A]" : "border-neutral-700"} bg-neutral-800`}
                          >
                            <Image source={{ uri: service.imageUrl }} className="w-full h-24" resizeMode="cover" />
                            <View className="min-h-12 flex-row items-center justify-between px-2">
                              <Text className={`flex-1 text-xs font-semibold ${selected ? "text-[#FFD60A]" : "text-white"}`} numberOfLines={2}>
                                {service.name}
                              </Text>
                              {selected ? <MaterialIcons name="check-circle" size={16} color="#FFD60A" /> : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </>
              ) : null}

              {serviceForm.imageUrl ? (
                <View className="flex-row items-center bg-neutral-800/70 border border-neutral-700 rounded-2xl p-3 mt-4">
                  <Image source={{ uri: serviceForm.imageUrl }} className="w-14 h-14 rounded-xl" resizeMode="cover" />
                  <View className="ml-3">
                    <Text className="text-neutral-400 text-xs">SELECTED SERVICE</Text>
                    <Text className="text-white font-bold mt-1">{serviceForm.name}</Text>
                  </View>
                  <MaterialIcons name="check-circle" size={20} color="#FFD60A" style={{ marginLeft: "auto" }} />
                </View>
              ) : null}

              <Text className="text-neutral-400 text-xs font-semibold mt-5 mb-2">SERVICE NAME</Text>
              <TextInput
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white"
                placeholder="e.g. Classic Haircut"
                placeholderTextColor="#9ca3af"
                value={serviceForm.name}
                onChangeText={(name) => setServiceForm({ ...serviceForm, name })}
              />
              <View className="flex-row gap-3 mt-4">
                <View className="flex-1">
                  <Text className="text-neutral-400 text-xs font-semibold mb-2">DURATION</Text>
                  <View className="flex-row items-center bg-neutral-800 border border-neutral-700 rounded-xl px-3">
                    <MaterialIcons name="schedule" size={18} color="#FFD60A" />
                    <TextInput
                      className="flex-1 px-2 py-3 text-white"
                      placeholder="30"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={serviceForm.durationMinutes}
                      onChangeText={(durationMinutes) => setServiceForm({ ...serviceForm, durationMinutes })}
                    />
                    <Text className="text-neutral-400 text-xs">min</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-400 text-xs font-semibold mb-2">PRICE</Text>
                  <View className="flex-row items-center bg-neutral-800 border border-neutral-700 rounded-xl px-3">
                    <MaterialIcons name="payments" size={18} color="#FFD60A" />
                    <TextInput
                      className="flex-1 px-2 py-3 text-white"
                      placeholder="25"
                      placeholderTextColor="#9ca3af"
                      keyboardType="decimal-pad"
                      value={serviceForm.price}
                      onChangeText={(price) => setServiceForm({ ...serviceForm, price })}
                    />
                    <Text className="text-neutral-400 text-xs">TND</Text>
                  </View>
                </View>
              </View>
              <View className="flex-row gap-3 mt-6">
                <TouchableOpacity onPress={() => setShowServiceEditor(false)} className="flex-1 border border-neutral-700 rounded-xl py-4">
                  <Text className="text-neutral-300 text-center font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={saving} onPress={() => void saveService()} className="flex-1 bg-[#FFD60A] rounded-xl py-4">
                  <Text className="text-black text-center font-bold">{saving ? "Saving..." : editingService ? "Save changes" : "Add service"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}