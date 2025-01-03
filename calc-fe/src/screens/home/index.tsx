import { ColorSwatch, Group } from "@mantine/core";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Draggable from "react-draggable";
import { SWATCHES } from "@/constants";
import { BiReset } from "react-icons/bi";
import { MdOutlineCalculate } from "react-icons/md";
import { LuEraser } from "react-icons/lu";

interface GeneratedResult {
  expression: string;
  answer: string;
}

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("rgb(255, 255, 255)");
  const [reset, setReset] = useState(false);
  const [dictOfVars, setDictOfVars] = useState({});
  const [result, setResult] = useState<GeneratedResult>();
  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
  const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (latexExpression.length > 0 && window.MathJax) {
      setTimeout(() => {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }, 0);
    }
  }, [latexExpression]);

  useEffect(() => {
    if (result) {
      renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result]);

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]);
      setResult(undefined);
      setDictOfVars({});
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
      }
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.MathJax.Hub.Config({
        tex2jax: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
        },
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const renderLatexToCanvas = (expression: string, answer: string) => {
    const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
    setLatexExpression([...latexExpression, latex]);

    // Clear the main canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.background = "black";
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (isEraser) {
          ctx.globalCompositeOperation = "destination-out"; // Erase mode
          ctx.lineWidth = 100; // Wider line for erasing
        } else {
          ctx.globalCompositeOperation = "source-over"; // Draw mode
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
        }
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const runRoute = async () => {
    const canvas = canvasRef.current;

    if (canvas) {
      const response = await axios({
        method: "post",
        url: `${import.meta.env.VITE_API_URL}/calculate`,
        data: {
          image: canvas.toDataURL("image/png"),
          dict_of_vars: dictOfVars,
        },
      });

      const resp = await response.data;
      console.log("Response", resp);
      resp.data.forEach((data: Response) => {
        if (data.assign === true) {
          // dict_of_vars[resp.result] = resp.answer;
          setDictOfVars({
            ...dictOfVars,
            [data.expr]: data.result,
          });
        }
      });
      const ctx = canvas.getContext("2d");
      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (imageData.data[i + 3] > 0) {
            // If pixel is not transparent
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setLatexPosition({ x: centerX, y: centerY });
      resp.data.forEach((data: Response) => {
        setTimeout(() => {
          setResult({
            expression: data.expr,
            answer: data.result,
          });
        }, 1000);
      });
    } // else warning if nothing exist on the canvas
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
          }
        };
        img.onerror = (error) => {
          console.error("Error loading image:", error);
        };
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 flex flex-col h-screen">
      {/* Top Buttons */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Button
          onClick={() => setReset(true)}
          className="z-20 bg-slate-600 text-white px-4 py-2 rounded-full"
          variant="default"
        >
          Reset Canvas
          <BiReset />
        </Button>

        <label className="z-20 bg-slate-600 text-white px-4 py-2 rounded-full flex items-center justify-center cursor-pointer">
          Upload Image
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <Button
          onClick={runRoute}
          className="z-20 bg-slate-600 text-white px-4 py-2 rounded-full"
          variant="default"
        >
          Calculate
          <MdOutlineCalculate />
        </Button>
      </div>

      <div className="flex flex-grow">
        {/* Left Section */}
        <div className="flex flex-col items-center mr-4">
          {/* Eraser Button */}
          <Button
            onClick={() => setIsEraser(!isEraser)}
            className={`z-20 w-12 h-20 rounded-full ${
              isEraser ? "bg-blue-600" : "bg-slate-600"
            } text-white mb-4`}
            variant="default"
          >
            <LuEraser />
          </Button>

          {/* Color Swatches */}
          <Group className="flex flex-col items-center gap-2">
            {SWATCHES.map((swatch) => (
              <ColorSwatch
                key={swatch}
                color={swatch}
                onClick={() => setColor(swatch)}
              />
            ))}
          </Group>
        </div>

        {/* Canvas Section */}
        <div className="relative flex-grow">
          <canvas
            ref={canvasRef}
            id="canvas"
            className="absolute top-0 left-0 w-full h-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
          />
        </div>
      </div>

      {/* Draggable LaTeX Content */}
      {latexExpression &&
        latexExpression.map((latex, index) => (
          <Draggable
            key={index}
            defaultPosition={latexPosition}
            onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
          >
            <div className="absolute p-2 text-white rounded shadow-md">
              <div className="latex-content">{latex}</div>
            </div>
          </Draggable>
        ))}
    </div>
  );
}

// return (
//   <>
//     {/* <div className="grid grid-cols-4 gap-2"> */}
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg">
//       <Button
//         onClick={() => setReset(true)}
//         className="z-20 bg-slate-600 text-white"
//         variant="default"
//         color="black"
//       >
//         Reset
//       </Button>
//       <Group className="z-20">
//         {SWATCHES.map((swatch) => (
//           <ColorSwatch
//             key={swatch}
//             color={swatch}
//             onClick={() => setColor(swatch)}
//           />
//         ))}
//       </Group>
//       <Button
//         onClick={() => setIsEraser(!isEraser)}
//         className={`z-20 ${
//           isEraser ? "bg-blue-600" : "bg-slate-600"
//         } text-white`}
//         variant="default"
//       >
//         {isEraser ? "Eraser On" : "Eraser Off"}
//       </Button>
//       <Button
//         onClick={runRoute}
//         className="z-20 bg-slate-600 text-white"
//         variant="default"
//         color="white"
//       >
//         Run
//       </Button>
//     </div>
//     <canvas
//       ref={canvasRef}
//       id="canvas"
//       className="absolute top-0 left-0 w-full h-full"
//       onMouseDown={startDrawing}
//       onMouseMove={draw}
//       onMouseUp={stopDrawing}
//       onMouseOut={stopDrawing}
//     />

//     {latexExpression &&
//       latexExpression.map((latex, index) => (
//         <Draggable
//           key={index}
//           defaultPosition={latexPosition}
//           onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
//         >
//           <div className="absolute p-2 text-white rounded shadow-md">
//             <div className="latex-content">{latex}</div>
//           </div>
//         </Draggable>
//       ))}
//   </>
// );
