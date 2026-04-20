import { useState, useEffect, useRef } from 'react';

const LegalPageLayout = ({ title, description, sections }) => {
  const [activeTab, setActiveTab] = useState(sections[0]?.id);
  const isScrollingRef = useRef(false);
  const tabsContainerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const scrollPosition = window.scrollY + 250; // Balanced offset for detection

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          const newId = sections[i].id;
          if (newId !== activeTab) {
            setActiveTab(newId);
            // On mobile, scroll the active tab into center of the horizontal bar safely
            const tabElement = document.getElementById(`tab-${newId}`);
            const container = tabsContainerRef.current;
            if (tabElement && container && window.innerWidth < 1024) {
              const scrollLeft = tabElement.offsetLeft - (container.offsetWidth / 2) + (tabElement.offsetWidth / 2);
              container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, activeTab]);

  const scrollToSection = (id) => {
    isScrollingRef.current = true;
    setActiveTab(id);
    
    const element = document.getElementById(id);
    if (element) {
      const offset = window.innerWidth < 1024 ? 140 : 120; // More offset on mobile for the horizontal nav
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  return (
    <div className="bg-white min-h-screen pt-20 lg:pt-32 pb-24 lg:pb-40">
      <div className="container-custom">
        {/* Minimalist Header */}
        <div className="max-w-3xl mx-auto mb-12 lg:mb-24 text-center px-4">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#0f172a] mb-6 lg:mb-8 tracking-tight">
            {title}
          </h1>
          <div className="h-1.5 w-12 bg-orange-500 mx-auto mb-6 lg:mb-10 rounded-full"></div>
          <p className="text-sm md:text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* Mobile Sticky Navigation (Horizontal) */}
        <div 
          ref={tabsContainerRef}
          className="lg:hidden sticky top-0 z-[50] bg-white/95 backdrop-blur-md border-b border-slate-100 -mx-4 px-4 mb-12 overflow-x-auto no-scrollbar py-4 whitespace-nowrap shadow-sm"
        >
          <div className="flex gap-4">
            {sections.map((section) => (
              <button
                key={section.id}
                id={`tab-${section.id}`}
                onClick={() => scrollToSection(section.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeTab === section.id
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-50 text-slate-500'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 relative">
          {/* Desktop Sticky Sidebar Navigation */}
          <aside className="hidden lg:block lg:w-1/3 xl:w-80 shrink-0">
            <div className="sticky top-32">
              <div className="bg-[#f8fafc] rounded-3xl p-10 border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">
                  Navigation
                </h3>
                <nav className="relative flex flex-col gap-1.5">
                  <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-200"></div>
                  
                  {sections.map((section) => {
                    const isActive = activeTab === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`group relative text-left pl-7 py-3 transition-all duration-500 outline-none`}
                      >
                        <div className={`absolute left-0 top-[15%] bottom-[15%] w-[3px] bg-orange-500 z-10 rounded-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                          isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
                        }`}></div>
                        
                        <span className={`text-[13px] font-bold tracking-tight transition-all duration-300 block ${
                          isActive 
                            ? 'text-orange-600 translate-x-1.5' 
                            : 'text-slate-500 hover:text-slate-900 translate-x-0'
                        }`}>
                          {section.title}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Scrollable Content */}
          <main className="flex-1 px-4 lg:px-0">
            <div className="space-y-20 lg:space-y-40">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-32 lg:scroll-mt-32 group"
                >
                  <div className="relative">
                    <h2 className="text-2xl lg:text-3xl font-black text-[#0f172a] mb-6 lg:mb-12 pb-4 lg:pb-8 border-b border-slate-100 transition-all duration-500 group-hover:border-orange-200/50">
                      {section.title}
                    </h2>
                    <div className="text-sm lg:text-[17px] text-slate-600 leading-relaxed lg:leading-[2] font-medium space-y-6 lg:space-y-10 max-w-none prose prose-slate prose-orange hover:prose-p:text-slate-900 transition-colors duration-500">
                      {section.content}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default LegalPageLayout;
