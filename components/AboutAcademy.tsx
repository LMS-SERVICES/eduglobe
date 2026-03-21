import React from "react";
import Image from "next/image";
import { IconVideo, IconClipboard, IconCheck, IconChart } from "./AboutAcademyIcons";

const FEATURE_TITLES = [
  "Concept-based video classes",
  "Mock tests & MCQs",
  "Previous year questions with explanations",
  "Exam strategies & shortcuts",
];

const FEATURE_ICONS = [IconVideo, IconClipboard, IconCheck, IconChart];

export function AboutAcademy() {
  return (
    <section id="about-academy" className="relative py-16 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8eaf6] via-[#c5cae9] to-[#7e57c2]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#5e35b1]/10 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1a237e] mb-6">
              About EduGlobe Academy
            </h2>
            <p className="text-slate-700 leading-relaxed mb-8 max-w-lg">
              A trusted platform for DSC, TET & CTET preparation, specializing in
              Mathematics and English (Paper-1 & Paper-2) across both mediums.
            </p>
            <ul className="space-y-4 mb-10">
              {FEATURE_TITLES.map((title, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <li key={i} className="flex items-center gap-4">
                    <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/80 border border-slate-200/80 shadow-sm flex items-center justify-center text-[#5e35b1]">
                      {Icon ? <Icon /> : null}
                    </span>
                    <span className="font-medium text-slate-800">{title}</span>
                  </li>
                );
              })}
            </ul>
            <p className="text-xl lg:text-2xl font-bold italic text-[#1a237e] drop-shadow-sm">
              We Don&apos;t Just Teach, We Build Confidence.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xl aspect-[584/475] rounded-2xl overflow-hidden border border-white/40 shadow-xl bg-white/40">
              <Image
                src="/about-students-only.png"
                alt="Students learning"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 92vw, 520px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
