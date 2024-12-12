from fastapi import FastAPI, HTTPException
import pandas as pd
import webbrowser
import logging
import numpy as np

# Initialize FastAPI app
app = FastAPI()

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Load datasets
try:
    coursera_clean_df = pd.read_csv('CourseraDataset-Clean.csv')
    coursea_data_df = pd.read_csv('coursea_data.csv')
    udemy_df = pd.read_csv('udemy_courses.csv')
    edx_df = pd.read_csv('EdX.csv')
    logging.info("Datasets loaded successfully.")
except FileNotFoundError as e:
    logging.error(f"Error loading datasets: {e}")
    raise HTTPException(status_code=500, detail="One or more datasets are missing.")

# Helper function to open URL in the browser
def open_url_in_browser(url: str):
    try:
        webbrowser.open(url)
    except Exception as e:
        logging.error(f"Error opening URL {url}: {e}")
        return False
    return True

# Endpoints for Udemy (using course_id)
@app.get("/courses/udemy/{course_id}")
def get_udemy_course(course_id: int):
    try:
        course = udemy_df[udemy_df['course_id'] == course_id]
        if course.empty:
            raise HTTPException(status_code=404, detail="Course ID not found")

        course_details = course.iloc[0].to_dict()
        url = course_details.get('url')
        if not open_url_in_browser(url):
            raise HTTPException(status_code=500, detail="Failed to open course URL")

        return {
            "platform": "Udemy",
            "course_details": course_details,
            "web_page_title": "Opened in Browser"
        }
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Endpoints for Coursera (Clean) - using course title
@app.get("/courses/coursera_clean/{course_title}")
def get_coursera_clean_course(course_title: str):
    try:
        # Find the course by title (case insensitive)
        course = coursera_clean_df[coursera_clean_df['Course Title'].str.contains(course_title, case=False, na=False)]
        if course.empty:
            raise HTTPException(status_code=404, detail="Course title not found")

        course_details = course.iloc[0].to_dict()
        url = course_details.get('Course Url')
        if not open_url_in_browser(url):
            raise HTTPException(status_code=500, detail="Failed to open course URL")

        return {
            "platform": "Coursera (Clean)",
            "course_details": course_details,
            "web_page_title": "Opened in Browser"
        }
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
# Additional methods to fetch courses with more flexibility

# Udemy Course Fetching Methods
@app.get("/courses/udemy/search")
def search_udemy_courses(
    title: str = None, 
    price_min: float = None, 
    price_max: float = None, 
    rating_min: float = None
):
    """
    Search Udemy courses with flexible filtering options
    """
    try:
        # Start with the full DataFrame
        filtered_courses = udemy_df.copy()

        # Apply filters if provided
        if title:
            filtered_courses = filtered_courses[
                filtered_courses['title'].str.contains(title, case=False, na=False)
            ]
        
        if price_min is not None:
            filtered_courses = filtered_courses[filtered_courses['price'] >= price_min]
        
        if price_max is not None:
            filtered_courses = filtered_courses[filtered_courses['price'] <= price_max]
        
        if rating_min is not None:
            filtered_courses = filtered_courses[filtered_courses['rating'] >= rating_min]
        
        if filtered_courses.empty:
            raise HTTPException(status_code=404, detail="No courses found matching the criteria")
        
        # Convert to list of dictionaries
        courses = [
            {
                "platform": "Udemy",
                "course_details": clean_course_data(course.to_dict())
            } 
            for _, course in filtered_courses.iterrows()
        ]
        
        return {
            "total_courses": len(courses),
            "courses": courses
        }
    
    except Exception as e:
        logging.error(f"Error searching Udemy courses: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Coursera Course Fetching Methods
@app.get("/courses/coursera/search")
def search_coursera_courses(
    title: str = None,
    skill: str = None,
    difficulty: str = None,
    language: str = None
):
    """
    Search Coursera courses with flexible filtering options
    """
    try:
        # Start with the full DataFrame
        filtered_courses = coursera_clean_df.copy()

        # Apply filters if provided
        if title:
            filtered_courses = filtered_courses[
                filtered_courses['Course Title'].str.contains(title, case=False, na=False)
            ]
        
        if skill:
            filtered_courses = filtered_courses[
                filtered_courses['Skills'].str.contains(skill, case=False, na=False)
            ]
        
        if difficulty:
            filtered_courses = filtered_courses[
                filtered_courses['Difficulty Level'] == difficulty
            ]
        
        if language:
            filtered_courses = filtered_courses[
                filtered_courses['Language'] == language
            ]
        
        if filtered_courses.empty:
            raise HTTPException(status_code=404, detail="No courses found matching the criteria")
        
        # Convert to list of dictionaries
        courses = [
            {
                "platform": "Coursera (Clean)",
                "course_details": clean_course_data(course.to_dict())
            } 
            for _, course in filtered_courses.iterrows()
        ]
        
        return {
            "total_courses": len(courses),
            "courses": courses
        }
    
    except Exception as e:
        logging.error(f"Error searching Coursera courses: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# EdX Course Fetching Methods
@app.get("/courses/edx/search")
def search_edx_courses(
    title: str = None,
    university: str = None,
    subject: str = None
):
    """
    Search EdX courses with flexible filtering options
    """
    try:
        # Start with the full DataFrame
        filtered_courses = edx_df.copy()

        # Apply filters if provided
        if title:
            filtered_courses = filtered_courses[
                filtered_courses['course_title'].str.contains(title, case=False, na=False)
            ]
        
        if university:
            filtered_courses = filtered_courses[
                filtered_courses['university'].str.contains(university, case=False, na=False)
            ]
        
        if subject:
            filtered_courses = filtered_courses[
                filtered_courses['subject'].str.contains(subject, case=False, na=False)
            ]
        
        if filtered_courses.empty:
            raise HTTPException(status_code=404, detail="No courses found matching the criteria")
        
        # Convert to list of dictionaries
        courses = [
            {
                "platform": "edX",
                "course_details": clean_course_data(course.to_dict())
            } 
            for _, course in filtered_courses.iterrows()
        ]
        
        return {
            "total_courses": len(courses),
            "courses": courses
        }
    
    except Exception as e:
        logging.error(f"Error searching edX courses: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Utility function to clean course data (remove NaN values)
def clean_course_data(course_data):
    return {
        key: (None if isinstance(value, float) and np.isnan(value) else value)
        for key, value in course_data.items()
    }
# Endpoints for Coursera (Original) - using course_id
@app.get("/courses/coursea_data/{course_id}")
def get_coursea_data_course(course_id: int):
    try:
        course = coursea_data_df[coursea_data_df['course_id'] == course_id]
        if course.empty:
            raise HTTPException(status_code=404, detail="Course ID not found")

        course_details = course.iloc[0].to_dict()
        url = course_details.get('url')
        if not open_url_in_browser(url):
            raise HTTPException(status_code=500, detail="Failed to open course URL")

        return {
            "platform": "Coursera (Original)",
            "course_details": course_details,
            "web_page_title": "Opened in Browser"
        }
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Endpoints for edX - using course title
@app.get("/courses/edx/{course_title}")
def get_edx_course(course_title: str):
    try:
        # Find the course by title (case insensitive)
        course = edx_df[edx_df['course_title'].str.contains(course_title, case=False, na=False)]
        if course.empty:
            raise HTTPException(status_code=404, detail="Course title not found")

        course_details = course.iloc[0].to_dict()
        url = course_details.get('url')
        if not open_url_in_browser(url):
            raise HTTPException(status_code=500, detail="Failed to open course URL")

        return {
            "platform": "edX",
            "course_details": course_details,
            "web_page_title": "Opened in Browser"
        }
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=
        500, detail="Internal Server Error")

# Endpoint to fetch all courses from all platforms
@app.get("/courses/all")
def get_all_courses():
    try:
        # Combine all course datasets
        all_courses = []

        # Helper function to replace NaN values with None
        def clean_course_data(course_data):
            return {key: (None if isinstance(value, float) and np.isnan(value) else value)
                    for key, value in course_data.items()}

        # Udemy courses
        for _, row in udemy_df.iterrows():
            course_details = row.to_dict()
            course_details = clean_course_data(course_details)
            all_courses.append({
                "platform": "Udemy",
                "course_details": course_details
            })

        # Coursera (Clean) courses
        for _, row in coursera_clean_df.iterrows():
            course_details = row.to_dict()
            course_details = clean_course_data(course_details)
            all_courses.append({
                "platform": "Coursera (Clean)",
                "course_details": course_details
            })

        # Coursera (Original) courses
        for _, row in coursea_data_df.iterrows():
            course_details = row.to_dict()
            course_details = clean_course_data(course_details)
            all_courses.append({
                "platform": "Coursera (Original)",
                "course_details": course_details
            })

        # edX courses
        for _, row in edx_df.iterrows():
            course_details = row.to_dict()
            course_details = clean_course_data(course_details)
            all_courses.append({
                "platform": "edX",
                "course_details": course_details
            })

        # Return all courses
        return {"all_courses": all_courses}

    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")