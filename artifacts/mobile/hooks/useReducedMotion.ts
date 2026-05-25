import { AccessibilityInfo } from "react-native";
import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReducedMotion)
      .catch((error) => {
        if (__DEV__) {
          console.warn("Failed to read reduce-motion preference", error);
        }
      });

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => subscription.remove();
  }, []);

  return reducedMotion;
}
