import PulseDot from "@/components/PulseDot";
import { Link, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { getHistory, getToday } from "../../../lib/api";
import { getToken, getUser, removeToken, removeUser } from "../../../lib/auth";
import { User } from "../../../types/api";

// glass = translucent white + subtle border + shadow. No new dep; BlurView would need expo-blur.
// ponytail: swap View bg-white/70 → <GlassView> / <BlurView> when need true backdrop blur.

type TodayData = {
  has_attendance: boolean;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  attendance_id?: string;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function fmtDateLong(d = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
function fmtTime(d = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function fmtClock(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(11, 16) || String(v);
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function Dashboard() {
  const [now, setNow] = useState(new Date());
  const [user, setUser] = useState<User | null>(null);
  const [today, setToday] = useState<TodayData | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setErr("");
    try {
      const token = await getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const [tRes, hRes, uRes] = await Promise.all([
        getToday(token),
        getHistory(token),
        getUser(),
      ]);

      setUser(uRes ?? null);

      if (tRes?.success) {
        setToday(tRes.data as TodayData);
      } else {
        setToday(null);
      }
      if (hRes?.success && Array.isArray(hRes.data)) {
        setRecent(hRes.data.slice(0, 3));
      }
    } catch (e: any) {
      setErr(e?.message ?? "Gagal memuat data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const status = useMemo(() => {
    if (!today) return { label: "Memuat…", dot: "#999", pill: "bg-white/70" };
    if (!today.has_attendance)
      return { label: "Belum absen", dot: "#ba2d0b", pill: "bg-amber-100" };
    if (today.check_in && !today.check_out)
      return {
        label: "Sedang bekerja",
        dot: "#16a34a",
        pill: "bg-emerald-100",
      };
    if (today.check_in && today.check_out)
      return { label: "Selesai", dot: "#003e1f", pill: "bg-[#003e1f]" };
    return { label: today.status ?? "—", dot: "#254d32", pill: "bg-white/70" };
  }, [today]);

  const canCheckIn = today ? !today.has_attendance : false;
  const canCheckOut = today ? !!today.check_in && !today.check_out : false;

  async function onLogout() {
    await removeToken();
    await removeUser();
    router.replace("/login");
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* decorative orbs behind glass */}
      <View
        pointerEvents="none"
        className="absolute -top-24 -right-24 size-72 rounded-full bg-white/60"
      />
      <View
        pointerEvents="none"
        className="absolute top-24 -left-20 size-64 rounded-full bg-card/10"
      />
      <View
        pointerEvents="none"
        className="absolute top-015 -right-10 size-48 rounded-full bg-white/40"
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#003e1f"
          />
        }
      >
        {/* header — profile glass */}
        <View className="px-6 pt-14 pb-4 gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View
                className="size-11 items-center justify-center rounded-full bg-white/80 border border-white"
                style={{
                  shadowColor: "#003e1f",
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                <Text className="text-sm font-bold text-primary">
                  {(user?.name ?? user?.username ?? "U")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
              <View className="gap-1 flex-1">
                <Text
                  className="text-[14px] font-bold ml-1 text-foreground leading-none"
                  numberOfLines={1}
                >
                  {user?.name ?? user?.username ?? "User"}
                </Text>
                <View className="self-start px-2.5 py-1 rounded-full bg-white/70 border border-white">
                  <Text className="text-[9px] tracking-wider font-bold text-foreground/70">
                    {(user?.role ?? "peserta").toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={onLogout}
              hitSlop={10}
              className="ml-3 px-3 py-2 rounded-full bg-white/70 border border-white"
            >
              <Text className="text-xs font-semibold text-foreground">
                Keluar
              </Text>
            </Pressable>
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-foreground/70">
              {greeting()},{" "}
              {(user?.username ?? user?.name ?? "User").split(" ")[0]} 👋
            </Text>
            <Text className="text-2xl font-bold text-foreground tracking-tight">
              Dashboard
            </Text>
            <Text className="text-xs text-foreground/60">
              {fmtDateLong(now)} • {fmtTime(now)} WITA
            </Text>
          </View>
        </View>

        {err ? (
          <View className="mx-6 mb-3 rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3">
            <Text className="text-sm text-destructive">{err}</Text>
          </View>
        ) : null}

        {/* hero glass card */}
        <View
          className="mx-6 rounded-[28px] border border-white bg-white/70 p-5 gap-4"
          style={{
            shadowColor: "#003e1f",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 4,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-[11px] tracking-widest font-semibold text-foreground/50">
                ABSENSI HARI INI
              </Text>
              <Text className="text-base font-bold text-foreground">
                {fmtDateLong(now).split(",")[1]?.trim() ?? "Hari ini"}
              </Text>
            </View>
            <View
              className={`px-3 py-1.5 rounded-full flex-row items-center gap-2 ${status.pill} border border-white`}
            >
              <PulseDot
                active={status.label !== "Selesai"}
                color={status.label === "Selesai" ? "#fff" : status.dot}
              />
              <Text
                className={`text-xs font-bold ${status.label === "Selesai" ? "text-white" : "text-foreground"}`}
              >
                {status.label}
              </Text>
            </View>
          </View>

          {/* timeline */}
          <View className="flex-row gap-4">
            <View className="items-center pt-1">
              <View
                className="size-3 rounded-full bg-primary border-2 border-white"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                }}
              />
              <View
                className="w-px flex-1 bg-foreground/15 my-1"
                style={{ minHeight: 32 }}
              />
              <View
                className={`size-3 rounded-full border-2 border-white ${canCheckOut || today?.check_out ? "bg-success" : "bg-foreground/20"}`}
              />
            </View>
            <View className="flex-1 gap-3">
              <View className="rounded-2xl bg-white border border-white px-4 py-3 flex-row justify-between items-center">
                <View>
                  <Text className="text-[11px] tracking-widest font-semibold text-foreground/50">
                    MASUK
                  </Text>
                  <Text className="text-lg font-bold text-foreground">
                    {fmtClock(today?.check_in ?? null)}
                  </Text>
                </View>
                <View
                  className={`px-2.5 py-1 rounded-full ${today?.check_in ? "bg-emerald-50 border border-emerald-200" : "bg-foreground/5 border border-foreground/10"}`}
                >
                  <Text
                    className={`text-[11px] font-bold ${today?.check_in ? "text-success" : "text-foreground/50"}`}
                  >
                    {today?.check_in ? "Tercatat" : "Belum"}
                  </Text>
                </View>
              </View>
              <View className="rounded-2xl bg-white border border-white px-4 py-3 flex-row justify-between items-center">
                <View>
                  <Text className="text-[11px] tracking-widest font-semibold text-foreground/50">
                    PULANG
                  </Text>
                  <Text className="text-lg font-bold text-foreground">
                    {fmtClock(today?.check_out ?? null)}
                  </Text>
                </View>
                <View
                  className={`px-2.5 py-1 rounded-full ${today?.check_out ? "bg-emerald-50 border border-emerald-200" : "bg-foreground/5 border border-foreground/10"}`}
                >
                  <Text
                    className={`text-[11px] font-bold ${today?.check_out ? "text-success" : "text-foreground/50"}`}
                  >
                    {today?.check_out ? "Tercatat" : "Belum"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* actions */}
          <View className="flex-row gap-3 pt-1">
            <Link href="/attendance" asChild>
              <Pressable
                disabled={!canCheckIn && !canCheckOut}
                className={`flex-1 h-12 rounded-2xl items-center justify-center flex-row gap-2 ${canCheckIn ? "bg-primary" : canCheckOut ? "bg-white border border-primary" : "bg-foreground/10"}`}
              >
                <Text
                  className={`text-sm font-bold ${canCheckIn ? "text-white" : canCheckOut ? "text-primary" : "text-foreground/40"}`}
                >
                  {canCheckIn
                    ? "Absen Masuk"
                    : canCheckOut
                      ? "Absen Pulang"
                      : "Sudah selesai"}
                </Text>
                <Text
                  className={
                    canCheckIn
                      ? "text-white"
                      : canCheckOut
                        ? "text-primary"
                        : "text-foreground/40"
                  }
                >
                  →
                </Text>
              </Pressable>
            </Link>
            <Link href="/history" asChild>
              <Pressable className="h-12 px-5 rounded-2xl bg-white/80 border border-white items-center justify-center">
                <Text className="text-sm font-bold text-foreground">
                  Riwayat
                </Text>
              </Pressable>
            </Link>
          </View>
          <Text className="text-[11px] text-foreground/50 text-center">
            Pastikan GPS & kamera aktif. Absensi butuh foto + lokasi kantor.
          </Text>
        </View>

        {/* stats glass grid */}
        <View className="mx-6 mt-4 flex-row gap-3">
          <View className="flex-1 rounded-[22px] bg-white/60 border border-white p-4 gap-1">
            <Text className="text-[11px] tracking-widest font-semibold text-foreground/50">
              MINGGU INI
            </Text>
            <Text className="text-2xl font-bold text-foreground">
              {recent.length}
            </Text>
            <Text className="text-xs text-foreground/60">riwayat tercatat</Text>
          </View>
          <View className="flex-1 rounded-[22px] bg-primary p-4 gap-1 border border-white/20">
            <Text className="text-[11px] tracking-widest font-semibold text-white/70">
              STATUS
            </Text>
            <Text className="text-sm font-bold text-white leading-5">
              {status.label}
            </Text>
            <Text className="text-xs text-white/70">
              {today?.has_attendance ? "Tetap semangat" : "Jangan lupa absen"}
            </Text>
          </View>
        </View>

        {/* recent */}
        <View className="mx-6 mt-5 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-foreground">
              Aktivitas terbaru
            </Text>
            <Link
              href="/history"
              className="text-xs font-semibold text-primary"
            >
              Lihat semua
            </Link>
          </View>
          {recent.length === 0 ? (
            <View className="rounded-[22px] bg-white/60 border border-white p-5 items-center gap-2">
              <Text className="text-sm text-foreground/60">
                Belum ada riwayat
              </Text>
              <Text className="text-xs text-foreground/40">
                Absensi kamu akan muncul di sini
              </Text>
            </View>
          ) : (
            recent.map((r) => (
              <View
                key={String(r.attendance_id ?? r.date ?? Math.random())}
                className="rounded-[22px] bg-white/70 border border-white px-4 py-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="size-10 rounded-full bg-primary items-center justify-center">
                    <Text className="text-white font-bold text-xs">
                      {String(r.date ?? "").slice(8, 10) || "•"}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-foreground">
                      {r.date ?? "—"}
                    </Text>
                    <Text className="text-xs text-foreground/60">
                      {fmtClock(r.check_in)} → {fmtClock(r.check_out)} •{" "}
                      {r.status ?? "Hadir"}
                    </Text>
                  </View>
                </View>
                <View
                  className={`px-2.5 py-1 rounded-full ${r.check_out ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}
                >
                  <Text
                    className={`text-[11px] font-bold ${r.check_out ? "text-success" : "text-amber-700"}`}
                  >
                    {r.check_out ? "Lengkap" : "Masuk"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View className="h-2" />
      </ScrollView>
    </View>
  );
}
