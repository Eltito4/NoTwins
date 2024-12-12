export async function handleShare(shareId: string): Promise<void> {
    const shareUrl = `${window.location.origin}/join/${shareId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Event',
          text: `Join my event using the event ID: ${shareId}`,
          url: shareUrl
        });
      } catch (err) {
        await copyToClipboard(shareUrl);
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  }
  
  export async function copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      throw new Error('Failed to copy to clipboard');
    }
  }