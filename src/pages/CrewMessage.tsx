import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Send, Image as ImageIcon, Plus, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { Message, Channel } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock user data (replace with actual auth)
const currentUser = {
  id: '1',
  name: 'John Doe',
};

export const CrewMessage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isNewChannelDialogOpen, setIsNewChannelDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchChannels();
    const channelSubscription = supabase
      .channel('channel-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, fetchChannels)
      .subscribe();

    return () => {
      channelSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentChannel) {
      fetchMessages();
      const messageSubscription = supabase
        .channel(`messages-${currentChannel.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `channel_id=eq.${currentChannel.id}`
          }, 
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as Message;
              setMessages(prev => [...prev, newMessage]);
              scrollToBottom();
            }
          }
        )
        .subscribe();

      return () => {
        messageSubscription.unsubscribe();
      };
    }
  }, [currentChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setChannels(data || []);
      if (data && data.length > 0 && !currentChannel) {
        setCurrentChannel(data[0]);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchMessages = async () => {
    if (!currentChannel) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', currentChannel.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !selectedImage) return;
    if (!currentChannel) return;

    setIsLoading(true);
    let imageUrl = '';

    try {
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('message-images')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('message-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create the new message object
      const newMessage: Partial<Message> = {
        channel_id: currentChannel.id,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        content: messageInput.trim(),
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      };

      // Optimistically add the message to the UI
      const optimisticMessage = {
        id: 'temp-' + Date.now(),
        ...newMessage,
      } as Message;
      
      setMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom();

      // Actually send the message
      const { error, data } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) throw error;

      // Replace the optimistic message with the real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? data : msg
        )
      );

      setMessageInput('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic message if there was an error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      const newChannel = {
        name: newChannelName,
        description: newChannelDescription,
      };

      const { error, data } = await supabase
        .from('channels')
        .insert([newChannel])
        .select()
        .single();

      if (error) throw error;

      setNewChannelName('');
      setNewChannelDescription('');
      setIsNewChannelDialogOpen(false);
      setCurrentChannel(data);
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex' }}>
      {/* Channels Sidebar */}
      <Box
        sx={{
          width: 240,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => setIsNewChannelDialogOpen(true)}
          >
            New Channel
          </Button>
        </Box>
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {channels.map((channel) => (
            <ListItem
              key={channel.id}
              button
              selected={channel.id === currentChannel?.id}
              onClick={() => setCurrentChannel(channel)}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Hash size={20} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={channel.name}
                secondary={channel.description}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Channel Header */}
        {currentChannel && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">
              # {currentChannel.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentChannel.description}
            </Typography>
          </Box>
        )}

        {/* Messages List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          <Stack spacing={2}>
            {messages.map((message) => (
              <Card
                key={message.id}
                sx={{
                  bgcolor: message.sender_id === currentUser.id
                    ? 'primary.light'
                    : 'background.paper',
                  color: message.sender_id === currentUser.id
                    ? 'white'
                    : 'text.primary',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {message.sender_name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {message.sender_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Box>
                  {message.content && (
                    <Typography variant="body1" sx={{ mb: message.image_url ? 2 : 0 }}>
                      {message.content}
                    </Typography>
                  )}
                  {message.image_url && (
                    <Box
                      component="img"
                      src={message.image_url}
                      alt="Message attachment"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            <div ref={messagesEndRef} />
          </Stack>
        </Box>

        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <ImageIcon size={20} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={handleImageSelect}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={isLoading || (!messageInput.trim() && !selectedImage)}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Send size={20} />}
            >
              Send
            </Button>
          </Stack>
          {selectedImage && (
            <Box sx={{ mt: 1 }}>
              <Chip
                label={selectedImage.name}
                onDelete={() => setSelectedImage(null)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* New Channel Dialog */}
      <Dialog
        open={isNewChannelDialogOpen}
        onClose={() => setIsNewChannelDialogOpen(false)}
      >
        <DialogTitle>Create New Channel</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Channel Name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Description"
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewChannelDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateChannel}
            variant="contained"
            disabled={!newChannelName.trim()}
          >
            Create Channel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};