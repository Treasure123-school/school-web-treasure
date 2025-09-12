import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Inbox, Reply, Search } from 'lucide-react';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export default function StudentMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', content: '', recipient: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return <div>Please log in to access your messages.</div>;
  }

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/messages/${user.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    }
  });

  // Format messages for display
  const formattedMessages = messages?.map((message: any) => ({
    id: message.id,
    subject: message.subject,
    content: message.content,
    sender: message.senderName || message.sender || 'School Administration',
    sentAt: new Date(message.createdAt || message.sentAt),
    isRead: message.isRead || false,
    priority: message.priority || 'normal'
  })) || [];

  // Filter messages based on search term
  const filteredMessages = formattedMessages.filter((message: any) =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unread count
  const unreadCount = formattedMessages.filter((msg: any) => !msg.isRead).length;

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handleSendMessage = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...newMessage,
          senderId: user.id
        })
      });
      
      if (response.ok) {
        setNewMessage({ subject: '', content: '', recipient: '' });
        setIsComposing(false);
        // Refetch messages
        queryClient.invalidateQueries({ queryKey: ['messages', user.id] });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout 
      userRole="student" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with teachers and school administration
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsComposing(true)}
              disabled={isComposing}
            >
              <Send className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Inbox className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold">{formattedMessages.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Read Rate</p>
                <p className="text-2xl font-bold">
                  {formattedMessages.length > 0 
                    ? Math.round(((formattedMessages.length - unreadCount) / formattedMessages.length) * 100)
                    : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compose Message */}
        {isComposing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Compose New Message</span>
                <Button variant="outline" size="sm" onClick={() => setIsComposing(false)}>
                  Cancel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => {
                    setNewMessage({ ...newMessage, subject: e.target.value });
                    if (error) setError(null);
                  }}
                  placeholder="Enter message subject"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={newMessage.content}
                  onChange={(e) => {
                    setNewMessage({ ...newMessage, content: e.target.value });
                    if (error) setError(null);
                  }}
                  placeholder="Type your message here..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                onClick={handleSendMessage} 
                disabled={!newMessage.subject || !newMessage.content || isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Messages List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading messages...</div>
            </CardContent>
          </Card>
        ) : filteredMessages.length > 0 ? (
          <div className="space-y-4">
            {filteredMessages.map((message: any) => (
              <Card 
                key={message.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${!message.isRead ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedMessage(selectedMessage?.id === message.id ? null : message)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className={`text-lg ${!message.isRead ? 'font-bold' : 'font-medium'}`}>
                          {message.subject}
                        </CardTitle>
                        {!message.isRead && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                        <Badge variant={getPriorityColor(message.priority)}>
                          {message.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>From: {message.sender}</span>
                        <span>{message.sentAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Reply className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {selectedMessage?.id === message.id && (
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : searchTerm ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No matching messages</h3>
                <p className="text-muted-foreground mb-4">
                  No messages found for "{searchTerm}". Try a different search term.
                </p>
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your messages from teachers and school administration will appear here.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/portal/student">
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}