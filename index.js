import { GoogleGenAI } from "@google/genai";

const apiKey = String(import.meta.env.VITE_GOOGLE_GENAI_API_KEY || "").trim();

const ai = new GoogleGenAI({
  apiKey
});

// 3.8-flash is often overloaded (503). 2.5-flash is blocked for new keys.
const MODEL_CANDIDATES = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash"
];

let preferredModel = MODEL_CANDIDATES[0];

function assertApiKey() {
  if (!apiKey) {
    throw new Error("Missing VITE_GOOGLE_GENAI_API_KEY in .env. Restart Vite after adding it.");
  }
}

function isRetryableModelError(error) {
  const msg = String(error?.message || error || "");
  return /503|UNAVAILABLE|high demand|404|NOT_FOUND|no longer available|not found/i.test(msg);
}

async function generateWithFallback({ contents, config }) {
  assertApiKey();
  const models = [preferredModel, ...MODEL_CANDIDATES.filter((model) => model !== preferredModel)];
  let lastError;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });
      preferredModel = model;
      console.log(`Using Gemini model: ${model}`);
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model ${model} failed:`, error?.message || error);
      if (!isRetryableModelError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("All Gemini models failed.");
}

const History = [];

async function runAgent(userProblem) {
  History.length = 0;
  History.push({
    role: "user",
    parts: [{ text: userProblem }]
  });

  let step = 0;
  let generatedFiles = { html: '', css: '', js: '' };
  let lastApiError = null;

  while (step < 5) { // Reduced steps for browser environment
    let response;
    try {
      response = await generateWithFallback({
        contents: History,
        config: {
          systemInstruction: `
You are an AI agent that generates complete websites based on user descriptions.

🎯 Your Goal:
- Generate complete HTML, CSS, and JavaScript code for a website
- Create modern, responsive, and functional websites
- Return the code in a structured format

Requirements:
1. Create a modern, responsive website that matches the description
2. Use semantic HTML5 with proper structure
3. Include modern CSS with gradients, animations, and responsive design
4. Add interactive JavaScript functionality relevant to the website type
5. Make it visually appealing and professional
6. Ensure it works on both desktop and mobile
7. Include proper meta tags and viewport settings
8. Use modern CSS features like flexbox, grid, and CSS variables
9. Add smooth animations and hover effects
10. Make sure the JavaScript is functional and enhances user experience
11. The design should be unique and match the specific requirements in the prompt
12. Use appropriate colors, fonts, and styling for the type of website requested
13. DO NOT include the prompt text in the HTML content - create actual website content
14. For calculator: Create a functional calculator with buttons and display
15. For portfolio: Create a professional portfolio with sections for work, about, contact
16. For restaurant: Create a restaurant website with menu, about, contact sections
17. For e-commerce: Create a product catalog with items, prices, add to cart functionality
18. For blog: Create a blog website with posts, categories, and a search functionality
19. For landing page: Create a single-page website with a clear call-to-action
20. For documentation: Create a technical documentation site with sections, navigation, and code examples
21. Every website must include a fully functional dark mode toggle. The dark mode should be visually distinct, user-friendly, and implemented using modern CSS and JavaScript. The toggle must be easily accessible, and the user's preference should persist across page reloads.
22. If the user requests a clone of an existing website, you must build a fully functional and visually accurate clone. The clone should closely match the original website’s layout, design, and interactive features, but do not copy any copyrighted content or branding. Use modern HTML, CSS, and JavaScript to replicate the look and feel, and ensure all main features and user interactions are present and working.
23. When building a clone of a website, you must ensure that all interactive elements (such as buttons, forms, toggles, navigation, and modals) are fully functional and behave as expected. Pay special attention to the main objective and core features of the requested website. For example, if building a LeetCode clone, implement a working code editor, question display, and submission functionality. Do not just replicate the appearance—ensure the main workflows and user interactions are implemented and operational using modern JavaScript. Prioritize the core experience and usability of the site.
24. Make the website fully responsive so that it automatically fits and looks great on all device sizes, including mobile phones, tablets, and desktops.
25. Always implement a hamburger menu for navigation in mobile view, ensuring the navigation is accessible and user-friendly on smaller screens.

IMPORTANT: Return your response in this exact format:
HTML:
<!DOCTYPE html>
<html>
<head>
    <title>Website Title</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css" />
</head>
<body>
    <!-- Your HTML content here -->
    <script src="/script.js"></script>
</body>
</html>

CSS:
/* Your CSS styles here */

JS:
// Your JavaScript code here

CRITICAL: Do NOT wrap your code in markdown code blocks. Return the raw code directly as shown in the format above.

Once you've provided the complete code, say: "Project is complete"
        `,
        }
      });
    } catch (error) {
      lastApiError = error;
      console.error("Gemini generation failed:", error?.message || error);
      break;
    }

    const message = response.text || "";

    History.push({
      role: "model",
      parts: [{ text: message }]
    });

    console.log(`💬 Gemini: ${message}`);

    // Improved parsing logic
    try {
      // Look for HTML section
      if (message.includes('HTML:')) {
        const htmlMatch = message.match(/HTML:\s*([\s\S]*?)(?=CSS:|JS:|Project is complete|$)/);
        if (htmlMatch) {
          let htmlContent = htmlMatch[1].trim();
          // Remove markdown code blocks if present
          htmlContent = htmlContent.replace(/```html\s*/g, '').replace(/```\s*$/g, '');
          generatedFiles.html = htmlContent;
          console.log("✅ HTML extracted");
        }
      }

      // Look for CSS section
      if (message.includes('CSS:')) {
        const cssMatch = message.match(/CSS:\s*([\s\S]*?)(?=JS:|HTML:|Project is complete|$)/);
        if (cssMatch) {
          let cssContent = cssMatch[1].trim();
          // Remove markdown code blocks if present
          cssContent = cssContent.replace(/```css\s*/g, '').replace(/```\s*$/g, '');
          generatedFiles.css = cssContent;
          console.log("✅ CSS extracted");
        }
      }

      // Look for JS section
      if (message.includes('JS:')) {
        const jsMatch = message.match(/JS:\s*([\s\S]*?)(?=HTML:|CSS:|Project is complete|$)/);
        if (jsMatch) {
          let jsContent = jsMatch[1].trim();
          // Remove markdown code blocks if present
          jsContent = jsContent.replace(/```js\s*/g, '').replace(/```javascript\s*/g, '').replace(/```\s*$/g, '');
          generatedFiles.js = jsContent;
          console.log("✅ JS extracted");
        }
      }

      // If we have at least HTML and CSS, or if project is complete, break
      if ((generatedFiles.html && generatedFiles.css) || message.toLowerCase().includes("project is complete")) {
        console.log("✅ AI has completed the project!");
        console.log("Generated files:", generatedFiles);
        break;
      }
    } catch (error) {
      console.error("Error parsing AI response:", error);
    }

    step++;
  }

  if (step >= 5) {
    console.log("⚠️ Max steps reached. Exiting...");
  }

  if (!generatedFiles.html && !generatedFiles.css && !generatedFiles.js && lastApiError) {
    throw lastApiError;
  }

  // If we don't have any generated files, create a fallback
  if (!generatedFiles.html && !generatedFiles.css && !generatedFiles.js) {
    console.log("Creating fallback website...");
    generatedFiles = {
      html: `<!DOCTYPE html>
<html>
<head>
    <title>${userProblem}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>${userProblem}</h1>
    <p>Website generated from your prompt: ${userProblem}</p>
</body>
</html>`,
      css: `body { 
    font-family: Arial, sans-serif; 
    padding: 20px; 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-height: 100vh;
    margin: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}

h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

p {
    font-size: 1.2rem;
    opacity: 0.9;
}`,
      js: `console.log('Website generated for: ${userProblem}');`
    };
  }

  return generatedFiles;
}



async function enhancePromptAI(userPrompt) {
  const response = await generateWithFallback({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Enhance the following website prompt to be more detailed, clear, and suitable for AI website generation. Focus on adding design elements, layout descriptions, animations, and functionality  and also make sure gave that prompt in just 5 to 6 lines only not beyond that.

Prompt:
"${userPrompt}"

Only respond with the enhanced prompt — no extra text, no explanation.`,
          },
        ],
      },
    ],
  });

  const enhancedPrompt = response.text?.trim();
  return enhancedPrompt || userPrompt; // fallback to original
}


// Export the runAgent function for use in Builder.jsx
export { runAgent, enhancePromptAI  };









// const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
// const SITE_TITLE = "AI Website Generator";

// const History = [];

// async function runAgent(userProblem) {
//   const systemPrompt = `You are an AI agent that generates complete websites based on user descriptions.

// 🎯 Your Goal:
// - Generate complete HTML, CSS, and JavaScript code for a website
// - Create modern, responsive, and functional websites
// - Return the code in a structured format

// Requirements:
// 1. Create a modern, responsive website that matches the description
// 2. Use semantic HTML5 with proper structure
// 3. Include modern CSS with gradients, animations, and responsive design
// 4. Add interactive JavaScript functionality relevant to the website type
// 5. Make it visually appealing and professional
// 6. Ensure it works on both desktop and mobile
// 7. Include proper meta tags and viewport settings
// 8. Use modern CSS features like flexbox, grid, and CSS variables
// 9. Add smooth animations and hover effects
// 10. Make sure the JavaScript is functional and enhances user experience
// 11. The design should be unique and match the specific requirements in the prompt
// 12. Use appropriate colors, fonts, and styling for the type of website requested
// 13. DO NOT include the prompt text in the HTML content - create actual website content
// 14. For calculator: Create a functional calculator with buttons and display
// 15. For portfolio: Create a professional portfolio with sections for work, about, contact
// 16. For restaurant: Create a restaurant website with menu, about, contact sections
// 17. For e-commerce: Create a product catalog with items, prices, add to cart functionality
// 18. For blog: Create a blog website with posts, categories, and a search functionality
// 19. For landing page: Create a single-page website with a clear call-to-action
// 20. For documentation: Create a technical documentation site with sections, navigation, and code examples
// 21. Every website must include a fully functional dark mode toggle. The dark mode should be visually distinct, user-friendly, and implemented using modern CSS and JavaScript. The toggle must be easily accessible, and the user's preference should persist across page reloads.
// 22. If the user requests a clone of an existing website, you must build a fully functional and visually accurate clone. The clone should closely match the original website’s layout, design, and interactive features, but do not copy any copyrighted content or branding. Use modern HTML, CSS, and JavaScript to replicate the look and feel, and ensure all main features and user interactions are present and working.
// 23. When building a clone of a website, you must ensure that all interactive elements (such as buttons, forms, toggles, navigation, and modals) are fully functional and behave as expected. Pay special attention to the main objective and core features of the requested website. For example, if building a LeetCode clone, implement a working code editor, question display, and submission functionality. Do not just replicate the appearance—ensure the main workflows and user interactions are implemented and operational using modern JavaScript. Prioritize the core experience and usability of the site.
// 24. Make the website fully responsive so that it automatically fits and looks great on all device sizes, including mobile phones, tablets, and desktops.
// 25. Always implement a hamburger menu for navigation in mobile view, ensuring the navigation is accessible and user-friendly on smaller screens.
// 26. Use relevant images fetched from online sources (such as Unsplash, Pexels, or similar) and include them in the website where appropriate. Do not use placeholder images; use real, visually appealing images that match the website's theme.
// 1. Use semantic HTML5 tags (nav, section, main, footer, etc.)
// 2. Include proper indentation (2 or 4 spaces), no minified code.
// 3. Head must include: title, meta charset, viewport, description, keywords.
// 4. Use modern web fonts from Google Fonts.
// 5. Include Font Awesome icons via CDN.
// 6. Navbar must support desktop + mobile toggle (write the JavaScript too).
// 7. Hero section: includes name, subtitle, CTA buttons, image.
// 8. About section: bio, 3 animated stats using JS.
// 9. Skills section: grouped by Frontend, Backend, Tools.
// 10. Projects section: 4 projects, each with image, tags, links to GitHub/demo.
// 11. Contact section: form with name/email/message + social links.
// 12. Footer with copyright.
// 13. Add hover animations for buttons.
// 14. Use CSS Flexbox or Grid — responsive for mobile, tablet, desktop.
// 15. Add all supporting JS/CSS inline or in \`<script>\`/\`<style>\` tags for simplicity.

// IMPORTANT: Return your response in this exact format:
// HTML:
// <!DOCTYPE html>
// <html>
// <head>
//     <title>Website Title</title>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <link rel="stylesheet" href="/style.css" />
// </head>
// <body>
//     <!-- Your HTML content here -->
//     <script src="/script.js"></script>
// </body>
// </html>

// CSS:
// /* Your CSS styles here */

// JS:
// // Your JavaScript code here

// CRITICAL: Do NOT wrap your code in markdown code blocks (such as three backticks with html, css, or js). Return the raw code directly as shown in the format above.

// Once you've provided the complete code, say: "Project is complete"`;

//   const messages = [
//     { role: "system", content: systemPrompt },
//     { role: "user", content: userProblem }
//   ];

//   let step = 0;
//   let generatedFiles = { html: '', css: '', js: '' };

//   while (step < 5) {
//     console.log('Sending request with messages:', messages);
//     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
//         "Content-Type": "application/json"
//       }, 
//       body: JSON.stringify({
//         model: "apodex/apodex-1.1-mini:free",
//         messages: messages,
//         max_tokens: 4096
//       })
//     });
     
//     const data = await response.json();
//     console.log('API Response:', data);
//     const message = data.choices?.[0]?.message?.content || "";

//     messages.push({ role: "assistant", content: message });

//     console.log(`💬 Gemini: ${message}`);

//     try {
//       if (message.includes('HTML:')) {
//         const htmlMatch = message.match(/HTML:\s*([\s\S]*?)(?=CSS:|JS:|Project is complete|$)/);
//         if (htmlMatch) {
//           generatedFiles.html = htmlMatch[1].trim().replace(/```html\s*/g, '').replace(/```\s*$/g, '');
//           console.log("✅ HTML extracted");
//         }
//       }

//       if (message.includes('CSS:')) {
//         const cssMatch = message.match(/CSS:\s*([\s\S]*?)(?=JS:|HTML:|Project is complete|$)/);
//         if (cssMatch) {
//           generatedFiles.css = cssMatch[1].trim().replace(/```css\s*/g, '').replace(/```\s*$/g, '');
//           console.log("✅ CSS extracted");
//         }
//       }

//       if (message.includes('JS:')) {
//         const jsMatch = message.match(/JS:\s*([\s\S]*?)(?=HTML:|CSS:|Project is complete|$)/);
//         if (jsMatch) {
//           generatedFiles.js = jsMatch[1].trim().replace(/```js\s*/g, '').replace(/```javascript\s*/g, '').replace(/```\s*$/g, '');
//           console.log("✅ JS extracted");
//         }
//       }

//       if ((generatedFiles.html && generatedFiles.css) || message.toLowerCase().includes("project is complete")) {
//         console.log("✅ AI has completed the project!");
//         break;
//       }
//     } catch (error) {
//       console.error("Error parsing AI response:", error);
//     }

//     step++;
//   }

//   if (step >= 5) console.log("⚠️ Max steps reached. Exiting...");

//   if (!generatedFiles.html && !generatedFiles.css && !generatedFiles.js) {
//     generatedFiles = {
//       html: `<!DOCTYPE html>
// <html>
// <head>
//     <title>${userProblem}</title>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
// </head>
// <body>
//     <h1>${userProblem}</h1>
//     <p>Website generated from your prompt: ${userProblem}</p>
// </body>
// </html>`,
//       css: `body {
//     font-family: Arial, sans-serif;
//     padding: 20px;
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     color: white;
//     min-height: 100vh;
//     margin: 0;
//     display: flex;
//     flex-direction: column;
//     justify-content: center;
//     align-items: center;
//     text-align: center;
// }

// h1 {
//     font-size: 3rem;
//     margin-bottom: 1rem;
//     text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
// }

// p {
//     font-size: 1.2rem;
//     opacity: 0.9;
// }`,
//       js: `console.log('Website generated for: ${userProblem}');`
//     };
//   }

//   return generatedFiles;
// }

// async function enhancePromptAI(userPrompt) {
//   const systemPrompt = `Enhance the following website prompt to be more detailed, clear, and suitable for AI website generation. Focus on adding design elements, layout descriptions, animations, and functionality and also make sure gave that prompt in just 5 to 6 lines only not beyond that.

// Prompt:
// "${userPrompt}"

// Only respond with the enhanced prompt — no extra text, no explanation.`;

//   const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       model: "google/gemma-4-31b-it:free",
//       messages: [
//         { role: "system", content: systemPrompt },
//         { role: "user", content: `Enhance the following website prompt to be more detailed, clear, and suitable for AI website generation. Focus on adding design elements, layout descriptions, animations, and functionality and also make sure gave that prompt in just 5 to 6 lines only not beyond that.\n\nPrompt:\n"${userPrompt}"\n\nOnly respond with the enhanced prompt — no extra text, no explanation.` }
//       ]
//     })
//   });
//   const data = await response.json();
//   const enhancedPrompt = data.choices?.[0]?.message?.content?.trim();
//   return enhancedPrompt || userPrompt;
// }

// export { runAgent, enhancePromptAI };



// // // tngtech/deepseek-r1t2-chimera:free  best model yet

// // // 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


// // google/gemini-2.0-flash-exp:free
// // // microsoft/mai-ds-r1:free
// // //thudm/glm-4-32b:free  good for image genration websites


// // meituan/longcat-flash-chat:free  best model to build the website 

