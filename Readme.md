# AI Calculator

AI Calculator is an intelligent tool designed to solve mathematical expressions and equations with ease. It supports advanced features such as handwriting recognition, image to text recognition and LaTeX rendering, making it ideal for students, educators, and professionals.

---

## Features

- **Handwriting Recognition**: Upload handwritten equations or problems and get their solutions.
- **LaTeX Rendering**: View solutions in a clean, professional LaTeX format.
- **Advanced Calculations**: Solve basic arithmetic, algebra, calculus, and graphical problems.
- **Cross-Platform**: Accessible on desktop and mobile browsers.

---

## How It Works

1. **Draw or Upload**: Draw equations on the canvas or upload an image.
2. **Process**: The app uses AI to recognize and analyze the input.
3. **Solution**: Get instant solutions displayed in LaTeX format.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JwalinPatel22/ai-calculator.git
   ```
2. Navigate to the project directory:
   ```bash
   cd ai-calculator
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt  # For backend
   npm install                      # For frontend
   ```
4. Start the python backend server:
   ```bash
  python main.py
   ```
5. Start the frontend:
   ```bash
   npm run dev
   ```

---

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: FastAPI
- **AI Integration**: Handwriting recognition with Python Base64 alongside Gemini

---
[[Pasted image 20250103132357.png]]
### Gemini API key
You can get your Gemini API key from https://aistudio.google.com/
- Create a `.env` file in calc-backend folder
- Paste your Gemini API key as follows:
		`GEMINI_API_KEY=yourapikey`
