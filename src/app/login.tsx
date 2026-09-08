import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { login } from "../../lib/api";
import { saveToken } from "../../lib/auth";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onLogin() {
    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setErr("Username dan password wajib diisi.");
      return;
    }

    setErr("");
    setLoading(true);

    try {
      const res = await login(cleanUsername, password);
      if (res?.success && res?.data?.token) {
        await saveToken(String(res.data.token));
        router.replace("/");
        return;
      } else {
        setErr(res?.message ?? "Login gagal. Periksa kredensial.");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e?.message);
      } else {
        setErr("Tidak terhubung ke server.");
      }
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    username.trim().length > 0 && password.length > 0 && !loading;

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="flex-1"
        >
          <View className="flex-1 px-6 pt-16 pb-8">
            {/* header */}
            <View className="items-center gap-3 mb-8">
              <View className="items-center justify-center w-24 h-24">
                <Image
                  source={require("../../assets/images/logo-bps.webp")}
                  className="size-14"
                />
              </View>
              <Text className="text-2xl font-bold text-foreground tracking-tight">
                Absensi Magang
              </Text>
              <Text className="text-sm text-muted-foreground">
                BPS Kabupaten Konawe
              </Text>
              <View className="mt-1 h-1 w-10 rounded-full bg-[#0d49a9]" />
            </View>

            {/* card */}
            <View className="rounded-[28px] bg-linear-to-br from-[#092055] via-[#0d49a9] to-[#1763db] border border-border p-6 gap-5">
              <View className="gap-1">
                <Text className="text-[11px] font-semibold tracking-widest text-white">
                  MASUK
                </Text>
                <Text className="text-lg font-bold text-white">
                  Selamat datang kembali
                </Text>
                <Text className="text-sm text-white">
                  Gunakan akun magang kamu untuk absen.
                </Text>
              </View>

              {err ? (
                <View className="rounded-2xl bg-destructive/40 border border-destructive/20 px-4 py-3">
                  <Text className="text-sm font-bold text-destructive leading-5">
                    {err}
                  </Text>
                </View>
              ) : null}

              <View className="gap-4">
                <View className="gap-2">
                  <Text className="text-xs font-semibold tracking-widest text-white">
                    USERNAME
                  </Text>
                  <TextInput
                    value={username}
                    onChangeText={(v) => {
                      setUsername(v);
                      if (err) setErr("");
                    }}
                    placeholder="Username"
                    placeholderTextColor="rgba(8,17,38,0.35)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    className="h-12 rounded-2xl bg-white border border-border px-4 pl-3 text-[15px] text-foreground"
                  />
                </View>

                <View className="gap-2">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs font-semibold tracking-widest text-white">
                      PASSWORD
                    </Text>
                    <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
                      <Text className="text-xs font-semibold text-white">
                        {show ? "Sembunyi" : "Lihat"}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (err) setErr("");
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(8,17,38,0.35)"
                    secureTextEntry={!show}
                    autoCapitalize="none"
                    textContentType="password"
                    onSubmitEditing={onLogin}
                    returnKeyType="done"
                    className="h-12 rounded-2xl bg-white border border-border px-4 pl-3 text-[15px] text-foreground"
                  />
                </View>
              </View>

              <Pressable
                onPress={onLogin}
                disabled={!canSubmit}
                className={`h-12 items-center justify-center rounded-2xl ${canSubmit ? "bg-primary" : "bg-primary/40"}`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[15px] font-bold text-white tracking-wide">
                    Masuk
                  </Text>
                )}
              </Pressable>

              <Text className="text-center text-xs leading-4 text-white pb-1">
                Masalah login? Hubungi pembimbing magang.
              </Text>
            </View>

            <Text className="text-center text-[11px] text-muted-foreground mt-6">
              © {new Date().getFullYear()} BPS Kabupaten Konawe
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
// ponytail: no form lib / validation schema / biometric — add when need complexity. No eye-icon dep — text toggle keeps bundle small.
