from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.http import FileResponse, Http404
from openai import OpenAI

client = OpenAI()

@api_view(['POST'])
def transcribe_audio(request):
    try:
        print("TESTING!")
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