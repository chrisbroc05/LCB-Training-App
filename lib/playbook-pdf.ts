import { execFile } from "node:child_process";
import { readFile, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { PLAYBOOK_CHAPTERS } from "@/lib/playbook-content";
import type { ensurePlaybookProgress } from "@/lib/playbook";

const execFileAsync = promisify(execFile);

type PlaybookProgressRecord = Awaited<ReturnType<typeof ensurePlaybookProgress>>;

export async function generatePlaybookMemberPdf(
  memberName: string,
  progress: PlaybookProgressRecord,
) {
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `lcb-playbook-${Date.now()}.pdf`);
  const inputPath = path.join(tempDir, `lcb-playbook-${Date.now()}.json`);

  const chapters = PLAYBOOK_CHAPTERS.map((chapterContent) => {
    const chapterProgress = progress.chapters.find(
      (chapter) => chapter.chapterNumber === chapterContent.number,
    );

    const reflections = chapterContent.reflectionQuestions.map((question, index) => {
      const saved = chapterProgress?.reflections.find(
        (reflection) => reflection.questionNumber === index + 1,
      );

      return {
        questionText: question,
        answer: saved?.answer ?? "",
      };
    });

    return {
      number: chapterContent.number,
      title: chapterContent.title,
      subtitle: chapterContent.subtitle,
      sections: chapterContent.sections,
      reflections,
    };
  });

  const payload = {
    memberName,
    outputPath,
    chapters,
  };

  await writeFile(inputPath, JSON.stringify(payload));

  const scriptPath = path.join(process.cwd(), "generate_playbook_member_pdf.py");

  try {
    await execFileAsync("python3", [scriptPath, inputPath], {
      maxBuffer: 10 * 1024 * 1024,
    });

    const pdfBuffer = await readFile(outputPath);
    return pdfBuffer;
  } finally {
    await unlink(inputPath).catch(() => undefined);
    await unlink(outputPath).catch(() => undefined);
  }
}
