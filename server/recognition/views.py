from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.http import FileResponse, Http404
from openai import OpenAI
from face_recognition.api import face_encodings, load_image_file

client = OpenAI()

@api_view(['POST'])
def transcribe_audio(request):
    try:
        audio_blob = request.FILES['audio']
        
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=(audio_blob.name,audio_blob.read(),audio_blob.content_type),
            language="en",
        )
        
        return Response({'text' : transcript.text}, status=status.HTTP_200_OK)
    except KeyError:
        return Response({'error': 'No audio file provided'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
def facial_recognition(request):
    try:
        frame_blob = request.FILES['frame']
        print(frame_blob)
        
        image_file = load_image_file(frame_blob)
        
        facial_encodings = face_encodings(image_file)
        
        print(facial_encodings)
        
        #Placeholder for response (still have to code in vector database handling)
        return Response({'text' : facial_encodings}, status=status.HTTP_200_OK)
        
    except KeyError:
        return Response({'error': 'No audio file provided'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(e)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
