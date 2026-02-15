/**
 * Generate rich AI content for all courses using Gemini.
 * Clears existing lessons and replaces with Gemini-generated content.
 * Run: npx tsx scripts/generate-course-content.ts [courseIndex]
 */
import 'dotenv/config';
import { db } from "../server/db";
import { lessons, courses } from "../shared/schema";
import { eq } from "drizzle-orm";
import { generateCourseContent } from "../server/services/gemini";

async function generateForCourse(courseIndex?: number) {
    const allCourses = await db.select().from(courses);
    console.log(`Found ${allCourses.length} courses\n`);

    const toProcess = courseIndex !== undefined
        ? [allCourses[courseIndex]]
        : allCourses;

    for (const course of toProcess) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Processing: ${course.title}`);
        console.log(`Difficulty: ${course.difficulty}`);
        console.log(`${'='.repeat(60)}`);

        // Clear existing lessons for this course
        const existing = await db.select().from(lessons).where(eq(lessons.courseId, course.id));
        if (existing.length > 0) {
            console.log(`Clearing ${existing.length} existing lessons...`);
            await db.delete(lessons).where(eq(lessons.courseId, course.id));
        }

        // Generate new content with Gemini (10 lessons per course)
        console.log(`Generating 10 lessons with Gemini...`);
        const startTime = Date.now();

        const generatedLessons = await generateCourseContent(
            course.title,
            course.difficulty as 'beginner' | 'intermediate' | 'advanced',
            10 // 10 lessons per course (~7 reading + 3 quiz)
        );

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`Generated ${generatedLessons.length} lessons in ${elapsed}s`);

        // Insert generated lessons
        for (let i = 0; i < generatedLessons.length; i++) {
            const lesson = generatedLessons[i];
            await db.insert(lessons).values({
                courseId: course.id,
                title: lesson.title,
                type: lesson.type,
                content: lesson.content,
                order: i + 1,
                xpReward: lesson.xpReward,
                estimatedMinutes: lesson.estimatedMinutes,
            });
            const icon = lesson.type === 'quiz' ? '❓' : '📖';
            console.log(`  ${icon} [${i + 1}] ${lesson.title} (${lesson.type}, ${lesson.estimatedMinutes}min, ${lesson.xpReward}XP)`);
        }

        // Update course module count
        await db.update(courses).set({ modules: generatedLessons.length }).where(eq(courses.id, course.id));
        console.log(`✅ ${course.title} — ${generatedLessons.length} lessons saved`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('All done!');

    // Final summary
    const allLessons = await db.select().from(lessons);
    console.log(`Total lessons in DB: ${allLessons.length}`);
}

const courseIdx = process.argv[2] ? parseInt(process.argv[2]) : undefined;
generateForCourse(courseIdx)
    .then(() => process.exit(0))
    .catch(e => { console.error('FATAL:', e); process.exit(1); });
