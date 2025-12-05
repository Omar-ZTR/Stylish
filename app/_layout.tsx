import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import "./global.css";

export default function RootLayout() {

const [fontLoaded, error] = useFonts ({
   "PlayfairBI": require("../assets/fonts/PlayfairDisplay-BlackItalic.ttf"),
   "PlayfairB": require("../assets/fonts/PlayfairDisplay-Bold.ttf"),
   "PlayfairR": require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
   "PlayfairI": require("../assets/fonts/PlayfairDisplay-Italic.ttf"),
   "PlayfairEB": require("../assets/fonts/PlayfairDisplay-ExtraBold.ttf"),
   "PlayfairBIT": require("../assets/fonts/PlayfairDisplay-BoldItalic.ttf"),
  });
  useEffect(() =>{
    if(error) throw error
    if(fontLoaded) SplashScreen.hideAsync();
  }, [fontLoaded,error]);

  return <Stack  screenOptions={{headerShown: false}}/>;
}


