
import { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import ChannelCard from '@/components/ChannelCard';
import VideoPlayer from '@/components/VideoPlayer';
import Footer from '@/components/Footer';
import SplashScreen from '@/components/SplashScreen';
import { channels, Channel } from '@/data/channels';
import { useFavorites } from '@/hooks/useFavorites';
import { Tv } from 'lucide-react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const filteredChannels = useMemo(() => {
    let result = channels;

    // Filter by favorites
    if (showFavorites) {
      result = result.filter(channel => favorites.includes(channel.id));
    }

    // Filter by category
    if (selectedCategory !== 'all' && !showFavorites) {
      result = result.filter(channel => channel.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(channel => 
        channel.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [channels, selectedCategory, searchQuery, showFavorites, favorites]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setShowFavorites(false);
  };

  const handleToggleFavorites = () => {
    setShowFavorites(!showFavorites);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
      <Helmet>
        <title>Dani Joiya Live TV - Watch Pakistani TV Channels Live</title>
        <meta name="description" content="Watch Pakistani and international TV channels live online. Stream news, entertainment, sports, and more with Wassi Live TV." />
        <meta name="keywords" content="Pakistani TV, live TV, streaming, news channels, entertainment, HUM TV, ARY Digital, Geo News" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background animate-fade-in">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Category Filter */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            showFavorites={showFavorites}
            onToggleFavorites={handleToggleFavorites}
            favoritesCount={favorites.length}
          />

          {/* Results Info */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              {showFavorites ? 'Your Favorites' : 
               selectedCategory === 'all' ? 'All Channels' : 
               `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Channels`}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredChannels.length} channel{filteredChannels.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Channels Grid */}
          {filteredChannels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {filteredChannels.map((channel, index) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isFavorite={isFavorite(channel.id)}
                  onToggleFavorite={toggleFavorite}
                  onSelect={setSelectedChannel}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Tv className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {showFavorites ? 'No Favorites Yet' : 'No Channels Found'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {showFavorites 
                  ? 'Click the heart icon on any channel to add it to your favorites.'
                  : 'Try adjusting your search or filter to find what you\'re looking for.'}
              </p>
            </div>
          )}
        </main>

        <Footer />

        {/* Video Player Modal */}
        {selectedChannel && (
          <VideoPlayer
            channel={selectedChannel}
            onClose={() => setSelectedChannel(null)}
          />
        )}
      </div>
    </>
  );
};

export default Index;
