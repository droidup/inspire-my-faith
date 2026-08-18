const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace the first try-catch
code = code.replace(/let retries = 3;\n\s*let delay = 5000;\n\s*while \(retries > 0\) {[\s\S]*?break;\n\s*}\s*catch \(err\) {[\s\S]*?}\n\s*}/, `let retries = 10;
              let delay = 5000;
              while (retries > 0) {
                try {
                  const response = await ai.models.generateContent({
                    model: 'gemini-3.6-flash',
                    contents: prompt,
                    config: {
                      responseMimeType: 'application/json',
                      responseSchema: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.STRING
                        }
                      }
                    }
                  });
                  let rawText = response.text || '[]';
                  const arrayMatch = rawText.match(/\\[[\\s\\S]*\\]/);
                  if (arrayMatch) {
                    rawText = arrayMatch[0];
                  }
                  translatedTexts = JSON.parse(rawText);
                  await new Promise(res => setTimeout(res, 4500));
                  break;
                } catch (err: any) {
                  if (err.status === 429 || (err.message && err.message.includes('429')) || (err.message && err.message.includes('Quota exceeded')) || err.name === 'SyntaxError') {
                    retries--;
                    if (retries === 0) throw err;
                    
                    let waitTime = delay;
                    if (err.message) {
                      const match = err.message.match(/Please retry in ([\\d.]+)s/);
                      if (match && match[1]) {
                        waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 2000;
                      }
                    }
                    console.log('Rate limited, waiting ' + waitTime + 'ms before retry...');
                    await new Promise(res => setTimeout(res, waitTime));
                    delay = 5000;
                  } else {
                    throw err;
                  }
                }
              }`);

// Replace the second try-catch
code = code.replace(/let retries = 3;\n\s*let delay = 5000;\n\s*while \(retries > 0\) {[\s\S]*?break;\n\s*}\s*catch \(err\) {[\s\S]*?}\n\s*}/, `let retries = 10;
              let delay = 5000;
              while (retries > 0) {
                try {
                  const response = await ai.models.generateContent({
                    model: 'gemini-3.6-flash',
                    contents: prompt,
                    config: {
                      responseMimeType: 'application/json',
                      responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    }
                  });
                  let rawText = response.text || '[]';
                  const arrayMatch = rawText.match(/\\[[\\s\\S]*\\]/);
                  if (arrayMatch) {
                    rawText = arrayMatch[0];
                  }
                  translatedTexts = JSON.parse(rawText);
                  await new Promise(res => setTimeout(res, 4500));
                  break;
                } catch (err: any) {
                  retries--;
                  if (retries === 0) {
                    console.error('Batch build Gemini error:', err);
                    break;
                  }
                  
                  let waitTime = delay;
                  if (err.message) {
                    const match = err.message.match(/Please retry in ([\\d.]+)s/);
                    if (match && match[1]) {
                      waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 2000;
                    }
                  }
                  console.log('Batch build rate limited, waiting ' + waitTime + 'ms before retry...');
                  await new Promise(res => setTimeout(res, waitTime));
                  delay = 5000;
                }
              }`);

fs.writeFileSync('server.ts', code);
