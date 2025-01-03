import { ColorSwatch, Group } from "@mantine/core";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { SWATCHES } from "@/constants";

interface GeneratedResult {
  expression: string;
  answer: string;
}

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

export default function ImageUpload() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [color, setColor] = useState("rgb(255, 255, 255)");
  const [reset, setReset] = useState(false);
  const [dictOfVars, setDictOfVars] = useState({});
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [latexExpression, setLatexExpression] = useState<string>("");
  const [eraserSize, setEraserSize] = useState(10);
  const [latexPostion, setLatexPosition] = useState({ x: 10, y: 20 });

  const renderLatexToCanvas = useCallback(
    (expression: string, answer: string) => {
      const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
      setLatexExpression(latex); // Setting latex expression

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before rendering
        }
      }
    },
    []
  );

  useEffect(() => {
    if (latexExpression && window.MathJax) {
      setTimeout(() => {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }, 0);
    }
  }, [latexExpression]);

  useEffect(() => {
    if (result) {
      renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result, renderLatexToCanvas]);

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression("");
      setResult(null);
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
  }, []);

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
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (isErasing) {
          ctx.strokeStyle = "white"; // Color for eraser
          ctx.lineWidth = eraserSize;
        } else {
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
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Check if canvas has any content
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const isCanvasEmpty = imageData.data.every((value) => value === 0); // Check if all pixels are transparent

        if (isCanvasEmpty) {
          alert("The image is blank. Please draw something.");
          return;
        }

        const imageDataUrl = canvas.toDataURL("image/png");
        console.log("Image Data URL:", imageDataUrl); // Log the image data URL

        try {
          const response = await axios({
            method: "post",
            url: `${import.meta.env.VITE_API_URL}/calculate`,
            data: {
              image: imageDataUrl,
              dict_of_vars: dictOfVars,
            },
          });

          const resp = await response.data;
          if (resp.data && resp.data.length > 0) {
            resp.data.forEach((data: Response) => {
              if (data.assign) {
                setDictOfVars((prevVars) => ({
                  ...prevVars,
                  [data.expr]: data.result,
                }));
              }
            });

            const ctx = canvas.getContext("2d");
            const imageData = ctx!.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            let minX = canvas.width,
              minY = canvas.height,
              maxX = 0,
              maxY = 0;

            for (let y = 0; y < canvas.height; y++) {
              for (let x = 0; x < canvas.width; x++) {
                const i = (y * canvas.width + x) * 4;
                if (imageData.data[i + 3] > 0) {
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
          }
        } catch (error) {
          console.error("Error during request:", error);
        }
      }
    }
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
              ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing the new image
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw image on canvas
            }
          }
        };
        img.onerror = (error) => {
          console.error("Error loading image:", error);
        };
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        console.log(latexPostion);
      };
      reader.readAsDataURL(file);
    } else {
      console.error("No file selected");
    }
  };

  return (
    <>
      <p>Image upload part</p>
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => setReset(true)}
          className="z-20 bg-black text-white"
          variant="default"
          color="black"
        >
          Reset
        </Button>
        <Group className="z-20">
          {SWATCHES.map((swatch) => (
            <ColorSwatch
              key={swatch}
              color={swatch}
              onClick={() => setColor(swatch)}
            />
          ))}
        </Group>
        <Button
          onClick={runRoute}
          className="z-20 bg-black text-white"
          variant="default"
          color="white"
        >
          Run
        </Button>

        {/* Toggle Eraser Button */}
        <Button
          onClick={() => setIsErasing(!isErasing)}
          className="z-20 bg-red-500 text-white"
          variant="default"
          color={isErasing ? "gray" : "red"}
        >
          {isErasing ? "Stop Erasing" : "Erase"}
        </Button>

        {/* Slider to adjust eraser size */}
        <div className="z-20">
          <label htmlFor="eraserSize">Eraser Size: {eraserSize}</label>
          <input
            id="eraserSize"
            type="range"
            min="5"
            max="50"
            value={eraserSize}
            onChange={(e) => setEraserSize(Number(e.target.value))}
            className="ml-2"
          />
        </div>

        {/* Image upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="z-20"
        />
      </div>

      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        className="border-2 border-black"
      />

      {/* Latex Expression Display */}
      <div id="latex" className="latex-output">
        {latexExpression && (
          <span dangerouslySetInnerHTML={{ __html: latexExpression }} />
        )}
      </div>
    </>
  );
}
