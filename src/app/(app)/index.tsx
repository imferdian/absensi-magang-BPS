import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { removeToken } from "../../../lib/auth";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onLogout() {
    setErr("");
    setLoading(true);
    try {
      await removeToken();
      router.replace("/login");
    } catch (e: unknown) {
      if (e instanceof Error) {
        return setErr(e?.message);
      } else {
        setErr("Gagal melakukan logout");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Text>Dashboard</Text>
      {err ? (
        <View className="rounded-2xl bg-destructive/40 border border-destructive/20 px-4 py-3">
          <Text className="text-sm font-bold text-destructive leading-5">
            {err}
          </Text>
        </View>
      ) : null}
      <Pressable
        disabled={loading}
        onPress={onLogout}
        className={`my-5 mx-4 h-12 items-center justify-center rounded-2xl border border-black bg-linear-to-b from-black to-gray-600`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white">Logout</Text>
        )}
      </Pressable>
      <Link href="/attendance" className="border border-black w-24 h-12 mt-10">Attendance</Link>
    </View>
  );
};

export default Index;
