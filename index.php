<?php
require_once 'header.php';
?>

<div class="max-w-7xl mx-auto px-8 md:px-16 py-12 md:py-24 animate-in fade-in duration-700">
    <!-- Hero Section -->
    <div class="flex flex-col lg:flex-row items-center gap-16 mb-24">
        <!-- Left: Logo -->
        <div class="w-full lg:w-1/2 flex justify-center">
            <div class="w-full max-w-md flex items-center justify-center p-4 relative group">
                <img src="/logo.png" alt="Inspire My Faith Logo" class="w-full h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
                    onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'text-center space-y-4 relative z-10\'><h2 class=\'text-5xl font-serif text-slate-900 tracking-tight\'>INSPIRE<br/>MY FAITH</h2><p class=\'text-sm font-bold text-[#c2094c] uppercase tracking-widest mt-2\'>Logo Placeholder</p></div>';" 
                />
            </div>
        </div>
        
        <!-- Right: Content -->
        <div class="w-full lg:w-1/2 space-y-10">
            <div class="space-y-6">
                <h3 class="text-primary font-bold tracking-widest text-[11px] uppercase">Discover the power of faith</h3>
                <h1 class="text-4xl sm:text-5xl md:text-6xl text-slate-900 font-serif leading-[1.1] tracking-tight">
                    Inspire My Faith
                </h1>
                <p class="text-stone-500 text-base sm:text-lg leading-relaxed max-w-lg">
                    Discover the profound and transformative journey of faith that awaits you as you embrace the love and guidance of God and Jesus, inviting their miraculous presence into every aspect of your life and allowing their divine influence to inspire and uplift your spirit.
                </p>
            </div>
            
            <!-- Verse of the Day Card Placeholder -->
            <div class="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                <h4 class="text-xs font-bold text-stone-400 tracking-widest uppercase mb-4">Verse of the Day</h4>
                <p class="text-lg font-serif italic text-slate-800">"For with God nothing shall be impossible."</p>
                <p class="text-sm font-bold text-primary mt-4">Luke 1:37</p>
            </div>
        </div>
    </div>

    <!-- Grid Section -->
    <div class="text-center space-y-20 pb-24 border-t border-stone-200 pt-24">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-serif text-slate-900 tracking-tight">Explore Inspire My Faith</h2>
        
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-12 gap-y-12 sm:gap-y-16 px-2 sm:px-0">
            <a href="bible.php" class="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group block">
                <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
                    <i data-lucide="book-open" class="w-8 h-8 stroke-[1.5]"></i>
                </div>
                <h5 class="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-primary transition-colors">The Holy Bible</h5>
                <p class="text-stone-500 text-sm max-w-[220px] leading-relaxed">Read, study, and search through the sacred scriptures.</p>
            </a>
            
            <a href="soul_search.php" class="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group block">
                <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
                    <i data-lucide="heart" class="w-8 h-8 stroke-[1.5]"></i>
                </div>
                <h5 class="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-primary transition-colors">Faith Prayer</h5>
                <p class="text-stone-500 text-sm max-w-[220px] leading-relaxed">Find verses tailored to your feelings and build your prayer journal.</p>
            </a>

            <a href="study_guide.php" class="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group block">
                <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
                    <i data-lucide="book-heart" class="w-8 h-8 stroke-[1.5]"></i>
                </div>
                <h5 class="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-primary transition-colors">Faith Guide</h5>
                <p class="text-stone-500 text-sm max-w-[220px] leading-relaxed">Build scripture memory and deeply understand God's Word.</p>
            </a>

            <a href="faith_verses.php" class="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group block">
                <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
                    <i data-lucide="heart-handshake" class="w-8 h-8 stroke-[1.5]"></i>
                </div>
                <h5 class="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-primary transition-colors">Faith Verses</h5>
                <p class="text-stone-500 text-sm max-w-[220px] leading-relaxed">Daily inspiration and a curated library of scripture.</p>
            </a>
            
            <a href="sermon_notes.php" class="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group block">
                <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
                    <i data-lucide="pen-tool" class="w-8 h-8 stroke-[1.5]"></i>
                </div>
                <h5 class="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-primary transition-colors">Faith Diary</h5>
                <p class="text-stone-500 text-sm max-w-[220px] leading-relaxed">Take organized notes during church and tag them by scripture.</p>
            </a>

            <a href="faith_timeline.php" class="flex flex-col items-center text-center space-y-5 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group block">
                <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-stone-100 group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
                    <i data-lucide="signpost" class="w-8 h-8 stroke-[1.5]"></i>
                </div>
                <h5 class="font-bold text-[11px] tracking-widest uppercase text-slate-900 group-hover:text-primary transition-colors">Faith Timeline</h5>
                <p class="text-stone-500 text-sm max-w-[220px] leading-relaxed">Track your answered prayers and key spiritual milestones.</p>
            </a>
        </div>
    </div>
</div>

<?php
require_once 'footer.php';
?>
