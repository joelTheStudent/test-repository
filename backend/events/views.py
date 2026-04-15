from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Event, EventShare, EventAttachment
from .serializers import EventSerializer, EventCreateSerializer, EventShareSerializer, EventAttachmentSerializer
from .permissions import IsOwnerOrShared, IsEventOwner

User = get_user_model()

class EventListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        owned = Event.objects.filter(owner=user)
        shared = Event.objects.filter(shares__shared_with=user)
        qs = (owned | shared).distinct()
        
        # Filter by date range
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if start:
            qs = qs.filter(start_datetime__gte=start)
        if end:
            qs = qs.filter(start_datetime__lte=end)
        return qs.order_by('start_datetime')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EventCreateSerializer
        return EventSerializer

    def create(self, request, *args, **kwargs):
        serializer = EventCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        return Response(EventSerializer(event, context={'request': request}).data, status=status.HTTP_201_CREATED)

class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrShared)
    serializer_class = EventSerializer

    def get_queryset(self):
        user = self.request.user
        owned = Event.objects.filter(owner=user)
        shared = Event.objects.filter(shares__shared_with=user)
        return (owned | shared).distinct()

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        if event.owner != request.user:
            return Response({'error': 'Only the owner can delete this event.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class EventShareView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_event(self, pk, user):
        event = get_object_or_404(Event, pk=pk)
        if event.owner != user:
            return None, Response({'error': 'Only the owner can manage shares.'}, status=status.HTTP_403_FORBIDDEN)
        return event, None

    def post(self, request, pk):
        event, error = self.get_event(pk, request.user)
        if error:
            return error
        email = request.data.get('email')
        permission = request.data.get('permission', EventShare.READ)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user == request.user:
            return Response({'error': 'Cannot share with yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        share, created = EventShare.objects.update_or_create(
            event=event, shared_with=user,
            defaults={'permission': permission}
        )
        return Response(EventShareSerializer(share).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def delete(self, request, pk):
        event, error = self.get_event(pk, request.user)
        if error:
            return error
        share_id = request.data.get('share_id')
        share = get_object_or_404(EventShare, pk=share_id, event=event)
        share.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class EventAttachmentUploadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        # Check access
        is_owner = event.owner == request.user
        has_edit = EventShare.objects.filter(event=event, shared_with=request.user, permission=EventShare.EDIT).exists()
        if not (is_owner or has_edit):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        attachment = EventAttachment.objects.create(
            event=event,
            uploaded_by=request.user,
            file=file,
            filename=file.name,
            file_size=file.size,
            content_type=file.content_type,
        )
        return Response(EventAttachmentSerializer(attachment, context={'request': request}).data, status=status.HTTP_201_CREATED)

class EventAttachmentDeleteView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request, pk, attachment_id):
        event = get_object_or_404(Event, pk=pk)
        attachment = get_object_or_404(EventAttachment, pk=attachment_id, event=event)
        is_owner = event.owner == request.user
        is_uploader = attachment.uploaded_by == request.user
        if not (is_owner or is_uploader):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        attachment.file.delete(save=False)
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
