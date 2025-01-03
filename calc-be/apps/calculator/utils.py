import google.generativeai as genai
import ast
import json
from PIL import Image
from constants import GEMINI_API_KEY

genai.configure(api_key="AIzaSyCdHxgw4tpnv6efkThQ4m7YoWHANqPbFSA")

def analyze_image(img: Image, dict_of_vars: dict):
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    dict_of_vars_str = json.dumps(dict_of_vars, ensure_ascii=False)
    prompt = (
        f"You have been given an image with some mathematical expressions, equations, or graphical problems, and you need to solve them. "
        f"Note: Use the PEMDAS rule for solving mathematical expressions. PEMDAS stands for the Priority Order: Parentheses, Exponents, Multiplication and Division (from left to right), Addition and Subtraction (from left to right). Parentheses have the highest priority, followed by Exponents, then Multiplication and Division, and lastly Addition and Subtraction. "
        f"For example: "
        f"Q. 2 + 3 * 4 "
        f"(3 * 4) => 12, 2 + 12 = 14. "
        f"Q. 2 + 3 + 5 * 4 - 8 / 2 "
        f"5 * 4 => 20, 8 / 2 => 4, 2 + 3 => 5, 5 + 20 => 25, 25 - 4 => 21. "
        f"YOU CAN HAVE FIVE TYPES OF EQUATIONS/EXPRESSIONS IN THIS IMAGE, AND ONLY ONE CASE SHALL APPLY EVERY TIME: "
        f"Following are the cases: "
        f"1. Simple mathematical expressions like 2 + 2, 3 * 4, 5 / 6, 7 - 8, etc.: In this case, solve and return the answer in the format of a LIST OF ONE DICT [{{'expr': given expression, 'result': calculated answer}}]. "
        f"2. Set of Equations like x^2 + 2x + 1 = 0, 3y + 4x = 0, 5x^2 + 6y + 7 = 12, etc.: In this case, solve for the given variable, and the format should be a COMMA SEPARATED LIST OF DICTS, with dict 1 as {{'expr': 'x', 'result': 2, 'assign': True}} and dict 2 as {{'expr': 'y', 'result': 5, 'assign': True}}. This example assumes x was calculated as 2, and y as 5. Include as many dicts as there are variables. "
        f"3. Assigning values to variables like x = 4, y = 5, z = 6, etc.: In this case, assign values to variables and return another key in the dict called {{'assign': True}}, keeping the variable as 'expr' and the value as 'result' in the original dictionary. RETURN AS A LIST OF DICTS. "
        f"4. Analyzing Graphical Math problems, which are word problems represented in drawing form, such as cars colliding, trigonometric problems, problems on the Pythagorean theorem, adding runs from a cricket wagon wheel, etc. These will have a drawing representing some scenario and accompanying information with the image. PAY CLOSE ATTENTION TO DIFFERENT COLORS FOR THESE PROBLEMS. You need to return the answer in the format of a LIST OF ONE DICT [{{'expr': given expression, 'result': calculated answer}}]. "
        f"5. Detecting Abstract Concepts that a drawing might show, such as love, hate, jealousy, patriotism, or a historic reference to war, invention, discovery, quote, etc. USE THE SAME FORMAT AS OTHERS TO RETURN THE ANSWER, where 'expr' will be the explanation of the drawing, and 'result' will be the abstract concept. "
        f"Analyze the equation or expression in this image and return the answer according to the given rules: "
        f"Make sure to use extra backslashes for escape characters like \\f -> \\\\f, \\n -> \\\\n, etc. "
        f"Here is a dictionary of user-assigned variables. If the given expression has any of these variables, use its actual value from this dictionary accordingly: {dict_of_vars_str}. "
        f"DO NOT USE BACKTICKS OR MARKDOWN FORMATTING. "
        f"PROPERLY QUOTE THE KEYS AND VALUES IN THE DICTIONARY FOR EASIER PARSING WITH Python's ast.literal_eval."
    )
    response = model.generate_content([prompt, img])
    print(response.text)
    answers = []
    try:
        answers = ast.literal_eval(response.text) #used to evaluate mathematical expressions in the form of string
    except Exception as e:
        print(f"Error in parsing response from Gemini API: {e}")
    print('returned answer ', answers)
    for answer in answers:
        if 'assign' in answer:
            answer['assign'] = True
        else:
            answer['assign'] = False
    return answers

# import google.generativeai as genai
# import json
# from PIL import Image
# from constants import GEMINI_API_KEY

# # Configure the generative AI with the provided API key
# genai.configure(api_key=GEMINI_API_KEY)

# def analyze_image(img: Image, dict_of_vars: dict):
#     """
#     Analyze the given image for mathematical expressions, equations, or problems
#     and solve them using the Gemini API.

#     Parameters:
#         img (Image): The image to be analyzed.
#         dict_of_vars (dict): A dictionary of user-assigned variables.

#     Returns:
#         list: A list of dictionaries containing the analysis results.
#     """
#     model = genai.GenerativeModel(model_name="gemini-1.5-flash")
#     dict_of_vars_str = json.dumps(dict_of_vars, ensure_ascii=False)
    
#     # Construct the prompt for the model
#     prompt = (
#         f"You have been given an image with some mathematical expressions, equations, or graphical problems, "
#         f"and you need to solve them. "
#         f"Note: Use the PEMDAS rule for solving mathematical expressions. PEMDAS stands for the Priority Order: "
#         f"Parentheses, Exponents, Multiplication and Division (from left to right), Addition and Subtraction "
#         f"(from left to right). Parentheses have the highest priority, followed by Exponents, then Multiplication "
#         f"and Division, and lastly Addition and Subtraction. "
#         f"Here are examples and guidelines for solving the problems:\n"
#         f"1. Simple mathematical expressions like 2 + 2: Return a list of one dictionary [{'expr': '2 + 2', 'result': 4}].\n"
#         f"2. Set of equations like x^2 + 2x + 1 = 0: Return a list of dictionaries for each variable solved.\n"
#         f"3. Assigning values to variables like x = 4: Add an 'assign': True key to the dictionary.\n"
#         f"4. Graphical Math Problems or Abstract Concepts: Return a dictionary explaining the result or concept.\n"
#         f"Here is a dictionary of user-assigned variables to use in your calculations: {dict_of_vars_str}."
#     )
    
#     # Call the generative model API with the constructed prompt
#     response = model.generate_content([prompt, img])
#     print("Raw response from Gemini API:", response.text)

#     answers = []
#     try:
#         # Correct the response by handling improper formats and escaping
#         corrected_response = (
#             response.text.replace("'", '"')  # Replace single quotes with double quotes for JSON compatibility
#             .replace("True", "true")         # Replace Python boolean with JSON boolean
#             .replace("False", "false")      # Replace Python boolean with JSON boolean
#         )
        
#         # Parse the corrected response
#         answers = json.loads(corrected_response)
#     except json.JSONDecodeError as e:
#         print(f"Error in parsing response from Gemini API: {e}")
#     except Exception as e:
#         print(f"Unexpected error: {e}")

#     print("Parsed answers:", answers)

#     # Process the answers and ensure the 'assign' key is added to each dictionary
#     for answer in answers:
#         if 'assign' not in answer:
#             answer['assign'] = False

#     return answers
