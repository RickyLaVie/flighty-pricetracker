"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function LineFriendBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already dismissed locally
    if (localStorage.getItem("line_bot_added") === "true") return;

    // Check real friendship status via LINE API
    fetch("/api/auth/line/friendship")
      .then((r) => r.json())
      .then((data) => {
        if (data.friendFlag) {
          localStorage.setItem("line_bot_added", "true");
        } else {
          setVisible(true);
        }
      })
      .catch(() => setVisible(true));
  }, []);

  function handleAddFriend() {
    localStorage.setItem("line_bot_added", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{ backgroundColor: "#F24822" }}
    >
      {/* Bot avatar */}
      <div className="shrink-0">
        <Image
          src="/flighty-profile-c.png"
          alt="Flighty"
          width={72}
          height={72}
          className="rounded-full"
        />
      </div>

      {/* Text + button */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-extrabold text-base leading-snug flex items-center gap-1.5 flex-wrap">
          加入
          <Image
            src="/Flighty-wt.svg"
            alt="Flighty"
            width={56}
            height={20}
            className="inline-block"
          />
          LINE 官方帳號
        </div>
        <p className="text-white font-bold text-sm mt-0.5">
          獲得便宜機票即時通知！
        </p>
        <a
          href="https://lin.ee/5dcWjLg"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAddFriend}
          className="inline-block mt-2"
        >
          <img
            src="https://scdn.line-apps.com/n/line_add_friends/btn/zh-Hant.png"
            alt="加入好友"
            height="36"
            style={{ height: "36px", width: "auto" }}
          />
        </a>
      </div>
    </div>
  );
}
