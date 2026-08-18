import { execSync } from 'child_process';

const startBook = 40; // Matthew
const endBook = 66; // Revelation

console.log(`Starting Red Letter Tagging for books ${startBook} to ${endBook}...`);

for (let bookId = startBook; bookId <= endBook; bookId++) {
    console.log(`\n================================`);
    console.log(`Kicking off tagging for Book ${bookId}`);
    console.log(`================================\n`);
    try {
        execSync(`npx tsx scripts/tag-red-letters.ts ${bookId}`, { stdio: 'inherit' });
    } catch (err) {
        console.error(`Error processing book ${bookId}:`, err);
        // Continue to the next book even if one fails
    }
}

console.log("\nAll New Testament books processed!");
