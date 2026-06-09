import { useState, useEffect, useRef, useCallback } from "react";
import "../components/FridgeIntro.css";

const SUBTEXT = "냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요.";

const TEXT_START_DELAY = 3800;
const TYPE_INTERVAL = 55;
const SUB_DELAY = 400;

interface FridgeIntroProps {
  isActive?: boolean;
  userName?: string;
}

function FridgeIntro({ isActive = true, userName = "사용자" }: FridgeIntroProps) {
  const headline =
    `${userName}님,\n 잇츠 인 마이 냉장고에 어서오세요!         \n ` +
    "냉장고 속 재료로 오늘은 무엇을 만들어볼까요?";

  const [typed, setTyped] = useState("");
  const [showText, setShowText] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const play = useCallback(() => {
    clearTimers();
    setTyped("");
    setShowText(false);
    setShowSub(false);
    setRunKey((prev) => prev + 1);
  }, [clearTimers]);

  useEffect(() => {
    if (!isActive) {
      clearTimers();
      return;
    }

    play();
    return () => clearTimers();
  }, [isActive, play, clearTimers]);

  useEffect(() => {
    if (runKey === 0) {
      return;
    }

    timersRef.current.push(
      window.setTimeout(() => {
        setShowText(true);

        let index = 0;
        const typeStep = () => {
          index += 1;
          setTyped(headline.slice(0, index));

          if (index < headline.length) {
            timersRef.current.push(window.setTimeout(typeStep, TYPE_INTERVAL));
          } else {
            timersRef.current.push(
              window.setTimeout(() => setShowSub(true), SUB_DELAY)
            );
          }
        };
        typeStep();
      }, TEXT_START_DELAY)
    );

    return () => clearTimers();
  }, [runKey, headline, clearTimers]);

  return (
    <div className="imf-wrap">
      <div className="imf-stage">
        <svg
          key={runKey}
          className="imf-svg"
          viewBox="0 0 300 300"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="KOOL-E 흰색 양문형 냉장고가 열리고 사과가 굴러나온 뒤 환영 문구가 나타나는 애니메이션"
        >
          <defs>
            <clipPath id="imf-body-clip">
              <rect x="60" y="40" width="180" height="240" rx="18" />
            </clipPath>
          </defs>

          <ellipse cx="150" cy="288" rx="92" ry="8" fill="rgba(0,0,0,0.08)" />

          <g>
            <rect x="60" y="40" width="180" height="240" rx="18" fill="#FBFCFE" stroke="#4A2C2A" strokeWidth="3" />

            <g className="imf-interior" clipPath="url(#imf-body-clip)">
              <rect x="64" y="44" width="172" height="232" fill="#DCEAF4" />
              <rect x="72" y="52" width="156" height="216" rx="8" fill="#EAF3FA" stroke="#B8D4E6" strokeWidth="1.5" />

              <line x1="72" y1="108" x2="228" y2="108" stroke="#FFFFFF" strokeWidth="4" />
              <line x1="72" y1="160" x2="228" y2="160" stroke="#FFFFFF" strokeWidth="4" />
              <line x1="72" y1="212" x2="228" y2="212" stroke="#FFFFFF" strokeWidth="4" />

              <g>
                <rect x="80" y="70" width="15" height="34" rx="3" fill="#FFFFFF" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="82" y="66" width="11" height="7" rx="2" fill="#FFFFFF" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="98" y="70" width="15" height="34" rx="3" fill="#FFFFFF" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="100" y="66" width="11" height="7" rx="2" fill="#FFFFFF" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="116" y="70" width="15" height="34" rx="3" fill="#FFFFFF" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="118" y="66" width="11" height="7" rx="2" fill="#FFFFFF" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="150" y="76" width="20" height="28" rx="3" fill="#F6E6D0" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="152" y="84" width="16" height="9" fill="#E24B4A" />
                <rect x="174" y="76" width="20" height="28" rx="3" fill="#EAF3DE" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="176" y="84" width="16" height="9" fill="#97C459" />
              </g>

              <g>
                <circle cx="92" cy="135" r="13" fill="#639922" stroke="#4A2C2A" strokeWidth="1.6" />
                <circle cx="86" cy="130" r="6" fill="#7FB52E" />
                <circle cx="98" cy="131" r="6" fill="#7FB52E" />
                <g stroke="#4A2C2A" strokeWidth="1.6">
                  <path d="M120 148 q-4 -22 4 -28 q6 4 4 12 q-2 14 -8 16 Z" fill="#EF9F27" />
                </g>
                <rect x="142" y="124" width="16" height="24" rx="7" fill="#F4D03F" stroke="#4A2C2A" strokeWidth="1.6" />
                <path d="M149 122 l0 -4" stroke="#639922" strokeWidth="2" strokeLinecap="round" />
                <circle cx="178" cy="137" r="13" fill="#E24B4A" stroke="#4A2C2A" strokeWidth="1.6" />
                <path d="M178 125 q3 -5 7 -3" stroke="#3B6D11" strokeWidth="2" fill="none" strokeLinecap="round" />
                <circle cx="205" cy="138" r="12" fill="#E24B4A" stroke="#4A2C2A" strokeWidth="1.6" />
                <path d="M205 127 q3 -4 6 -2" stroke="#3B6D11" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>

              <g>
                <rect x="82" y="178" width="16" height="26" rx="3" fill="#F4D03F" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="80" y="174" width="20" height="6" rx="2" fill="#D85A30" stroke="#4A2C2A" strokeWidth="1.4" />
                <rect x="104" y="178" width="16" height="26" rx="3" fill="#F09997" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="102" y="174" width="20" height="6" rx="2" fill="#D85A30" stroke="#4A2C2A" strokeWidth="1.4" />
                <rect x="126" y="178" width="16" height="26" rx="3" fill="#97C459" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="124" y="174" width="20" height="6" rx="2" fill="#639922" stroke="#4A2C2A" strokeWidth="1.4" />
                <rect x="156" y="186" width="64" height="18" rx="3" fill="#F1EFE8" stroke="#4A2C2A" strokeWidth="1.6" />
                <circle cx="166" cy="189" r="5" fill="#FBE7C8" stroke="#4A2C2A" strokeWidth="1.2" />
                <circle cx="178" cy="189" r="5" fill="#FBE7C8" stroke="#4A2C2A" strokeWidth="1.2" />
                <circle cx="190" cy="189" r="5" fill="#FBE7C8" stroke="#4A2C2A" strokeWidth="1.2" />
                <circle cx="202" cy="189" r="5" fill="#FBE7C8" stroke="#4A2C2A" strokeWidth="1.2" />
                <circle cx="214" cy="189" r="5" fill="#FBE7C8" stroke="#4A2C2A" strokeWidth="1.2" />
              </g>

              <g>
                <path d="M80 232 q24 14 52 0 l-6 26 q-20 8 -40 0 Z" fill="#D9A368" stroke="#4A2C2A" strokeWidth="1.6" />
                <circle cx="95" cy="226" r="9" fill="#E24B4A" stroke="#4A2C2A" strokeWidth="1.4" />
                <circle cx="112" cy="224" r="9" fill="#F4D03F" stroke="#4A2C2A" strokeWidth="1.4" />
                <ellipse cx="122" cy="228" rx="6" ry="9" fill="#7F77DD" stroke="#4A2C2A" strokeWidth="1.4" />
                <rect x="150" y="232" width="30" height="26" rx="3" fill="#D6E8DA" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="150" y="230" width="30" height="5" rx="2" fill="#9FE1CB" stroke="#4A2C2A" strokeWidth="1.4" />
                <rect x="186" y="232" width="30" height="26" rx="3" fill="#F6D9C8" stroke="#4A2C2A" strokeWidth="1.6" />
                <rect x="186" y="230" width="30" height="5" rx="2" fill="#F0997B" stroke="#4A2C2A" strokeWidth="1.4" />
              </g>
            </g>
          </g>

          <g className="imf-door-left">
            <rect x="140" y="44" width="12" height="232" rx="3" fill="#D8DEE6" stroke="#4A2C2A" strokeWidth="2" />
            <rect x="62" y="42" width="80" height="236" rx="14" fill="#FBFCFE" stroke="#4A2C2A" strokeWidth="3" />
            <rect x="68" y="48" width="68" height="224" rx="9" fill="#F2F7FC" />
            <rect x="124" y="120" width="7" height="66" rx="3.5" fill="#E3E8EE" stroke="#4A2C2A" strokeWidth="2" />
          </g>

          <g className="imf-door-right">
            <rect x="148" y="44" width="12" height="232" rx="3" fill="#D8DEE6" stroke="#4A2C2A" strokeWidth="2" />
            <rect x="158" y="42" width="80" height="236" rx="14" fill="#FBFCFE" stroke="#4A2C2A" strokeWidth="3" />
            <rect x="164" y="48" width="68" height="224" rx="9" fill="#F2F7FC" />
            <rect x="169" y="120" width="7" height="66" rx="3.5" fill="#E3E8EE" stroke="#4A2C2A" strokeWidth="2" />
            <rect x="180" y="58" width="50" height="30" rx="5" fill="#DCEAF4" stroke="#4A2C2A" strokeWidth="2" />
            <text x="205" y="72" textAnchor="middle" fontSize="10" fontWeight="600" fill="#4A2C2A">3° / -19°</text>
            <text x="205" y="83" textAnchor="middle" fontSize="6" fill="#5F5E5A">fridge   free</text>
            <text x="200" y="104" textAnchor="middle" fontSize="9" fontWeight="600" fill="#5F5E5A" letterSpacing="1">KOOL-E</text>
          </g>

          <rect x="78" y="278" width="14" height="10" rx="3" fill="#E3E8EE" stroke="#4A2C2A" strokeWidth="2" />
          <rect x="208" y="278" width="14" height="10" rx="3" fill="#E3E8EE" stroke="#4A2C2A" strokeWidth="2" />

          <g className="imf-apple">
            <circle cx="0" cy="0" r="11" fill="#E24B4A" stroke="#4A2C2A" strokeWidth="2" />
            <path d="M-3 -10 q3 -6 8 -3" stroke="#3B6D11" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="-4" cy="-3" rx="3" ry="2" fill="#fff" opacity="0.5" />
          </g>
        </svg>
      </div>

      <div className={`imf-text${showText ? " imf-show" : ""}`}>
        <div className="imf-headline">
          <span>{typed}</span>
          <span className="imf-cursor" />
        </div>
        <p className={`imf-sub${showSub ? " imf-show" : ""}`}>{SUBTEXT}</p>
      </div>
    </div>
  );
}

export default FridgeIntro;
