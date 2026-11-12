"use client";

import { useSyncExternalStore } from "react";
import styles from "./customer-display.module.css";

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

/** Hiện nút khi trình duyệt cho phép toàn màn hình và màn chưa ở chế độ đó. */
const canEnter = () => document.fullscreenEnabled === true && !document.fullscreenElement;

/**
 * Nút nhỏ cho người đứng quầy đưa màn sang toàn màn hình (ẩn thanh trình duyệt) trước khi quay cho khách.
 * Thoát bằng phím Esc như mặc định của trình duyệt.
 */
export function FullscreenButton() {
  const visible = useSyncExternalStore(subscribe, canEnter, () => false);
  if (!visible) return null;
  return (
    <button
      type="button"
      className={styles.fullscreen}
      onClick={() => void document.documentElement.requestFullscreen().catch(() => undefined)}
    >
      Toàn màn hình
    </button>
  );
}
