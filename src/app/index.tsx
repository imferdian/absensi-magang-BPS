import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useEffect, useState } from "react";

import { getToken } from "../../lib/auth";

export default function Index() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();

        setAuthenticated(!!token);
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  if (checkingAuth) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (authenticated) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/login" />;
}