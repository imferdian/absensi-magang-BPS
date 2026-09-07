import { Link } from "expo-router";
import { Text, View } from "react-native";
import "../../global.css";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">
        Welcome Perdiansyah
      </Text>
      <Link
        href="/login"
        className="mt-4 font-semibold text-lg rounded-xl bg-black text-white p-4"
      >
        Login
      </Link>
    </View>
  );
}
