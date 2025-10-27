import Game from "@/components/Game";
import { Stack } from "expo-router";

export default function Index() {
  return (<>
  <Stack.Screen options={{ title: "Calculator", headerShown: false }} />
  <Game />
  </>);
}


