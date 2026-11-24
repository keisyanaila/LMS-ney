"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  saveDraft,
  submitAttempt,
  type AnswerInput,
} from "@/app/siswa/online-actions";

export type RunnerQuestion = {
  id: number;
  type: "pilihan_ganda" | "esai";
  text: string;
  options: string[] | null;
  points: number;
};

function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export default function QuizRunner({
  tcId,
  assessmentId,
  questions,
  initial,
  deadlineIso,
  serverNowIso,
}: {
  tcId: number;
  assessmentId: number;
  questions: RunnerQuestion[];
  initial: AnswerInput;
  deadlineIso: string | null;
  serverNowIso: string;
}) {
  const [answers, setAnswers] = useState<AnswerInput>(initial);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [saveLabel, setSaveLabel] = useState("");
  const [pending, startTransition] = useTransition();

  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  const skewRef = useRef(0);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submit = useCallback(() => {
    if (submittedRef.current) return;

    submittedRef.current = true;

    startTransition(async () => {
      await submitAttempt(
        String(tcId),
        String(assessmentId),
        answersRef.current
      );
    });
  }, [tcId, assessmentId]);

  // Hitung mundur berdasarkan jam server agar tidak terpengaruh jam perangkat.
  useEffect(() => {
    skewRef.current = Date.parse(serverNowIso) - Date.now();

    if (!deadlineIso) return;

    const deadline = Date.parse(deadlineIso);

    const tick = () => {
      const left = deadline - (Date.now() + skewRef.current);

      setRemaining(left);

      if (left <= 0) submit();
    };

    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [deadlineIso, serverNowIso, submit]);

  // Simpan otomatis setiap kali jawaban berubah.
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (submittedRef.current) return;

      setSaveLabel("Menyimpan...");

      const result = await saveDraft(
        String(tcId),
        String(assessmentId),
        answersRef.current
      );

      setSaveLabel(result.ok ? "Tersimpan" : "Gagal menyimpan, periksa koneksi");
    }, 1500);

    return () => clearTimeout(handle);
  }, [answers, tcId, assessmentId]);

  const answered = questions.filter((q) => {
    const answer = answers[q.id];

    return q.type === "pilihan_ganda"
      ? answer?.selected !== null && answer?.selected !== undefined
      : Boolean(answer?.essay?.trim());
  }).length;

  const urgent = remaining !== null && remaining < 60_000;

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div className="text-sm">
          <span className="font-semibold">
            Terjawab {answered}/{questions.length}
          </span>
          {saveLabel && (
            <span className="ml-3 text-xs text-black/50">{saveLabel}</span>
          )}
        </div>

        {deadlineIso && (
          <div
            className={`rounded-md px-3 py-1.5 text-sm font-bold tabular-nums ${
              urgent ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
            }`}
            aria-live="off"
          >
            Sisa waktu: {remaining === null ? "..." : formatClock(remaining)}
          </div>
        )}
      </div>

      <div className="space-y-5">
        {questions.map((question, index) => {
          const answer = answers[question.id];

          return (
            <section
              key={question.id}
              className="rounded-lg border border-black/10 bg-white p-5"
            >
              <p className="text-xs font-semibold text-black/50">
                Soal {index + 1} · {question.points} poin
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold">
                {question.text}
              </p>

              {question.type === "pilihan_ganda" ? (
                <div className="mt-3 space-y-2">
                  {(question.options ?? []).map((option, i) => (
                    <label
                      key={i}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition ${
                        answer?.selected === i
                          ? "border-blue-500 bg-blue-50"
                          : "border-black/10 hover:border-blue-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        checked={answer?.selected === i}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: { selected: i, essay: "" },
                          }))
                        }
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-semibold">
                          {String.fromCharCode(65 + i)}.
                        </span>{" "}
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  rows={5}
                  value={answer?.essay ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: { selected: null, essay: e.target.value },
                    }))
                  }
                  maxLength={10000}
                  placeholder="Tulis jawaban Anda di sini"
                  className="mt-3 w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const unanswered = questions.length - answered;
            const message = unanswered
              ? `Masih ada ${unanswered} soal belum dijawab. Kirim sekarang? Jawaban tidak bisa diubah setelah dikirim.`
              : "Kirim jawaban sekarang? Jawaban tidak bisa diubah setelah dikirim.";

            if (confirm(message)) submit();
          }}
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {pending ? "Mengirim..." : "Kirim Jawaban"}
        </button>
      </div>
    </div>
  );
}
