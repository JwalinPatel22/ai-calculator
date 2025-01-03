# from fastapi import APIRouter
# import base64
# from io import BytesIO
# from apps.calculator.utils import analyze_image
# from schema import ImageData
# from PIL import Image

# router = APIRouter()

# @router.post('')
# async def run(data: ImageData):
#     image_data = base64.b64decode(data.image.split(",")[1])  # Assumes data:image/png;base64,<data>
#     image_bytes = BytesIO(image_data)
#     image = Image.open(image_bytes)
#     responses = analyze_image(image, dict_of_vars=data.dict_of_vars)
#     data = []
#     for response in responses:
#         data.append(response)
#     print('response in route: ', response)
#     return {"message": "Image processed", "data": data, "status": "success"}

from fastapi import APIRouter
import base64
from io import BytesIO
from apps.calculator.utils import analyze_image
from schema import ImageData
from PIL import Image

router = APIRouter()

@router.post('')
async def run(data: ImageData):
    try:
        # Decode the base64 image data
        image_data = base64.b64decode(data.image.split(",")[1])  # Assumes data:image/png;base64,<data>
        image_bytes = BytesIO(image_data)
        image = Image.open(image_bytes)
        
        # Analyze the image
        responses = analyze_image(image, dict_of_vars=data.dict_of_vars)
        
        # Process responses
        data = []
        for response in responses:
            data.append(response)
        
        # Safely handle the response variable
        if responses:
            print("response in route: ", responses[-1])  # Print the last response in the list
        else:
            print("response in route: No responses generated")
        
        return {"message": "Image processed", "data": data, "status": "success"}
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"message": "Failed to process image", "error": str(e), "status": "error"}
