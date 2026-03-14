import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import AchievementsSection from "../components/AchievementsSection";
import CoursesSection from "../components/CoursesSection";
import QuotesSection from "../components/QuotesSection";
import MentorsSection from "../components/MentorsSection";
import StudentLifeSection from "../components/StudentLifeSection";
import EventsGallery from "../components/EventsGallery";
import CounselorCTA from "../components/CounselorCTA";
import HiringStatsSection from "../components/HiringStatsSection";
import Footer from "../components/Footer";
import SignupPopup from "../components/SignupPopup";
import CallPopup from "../components/CallPopup";

export default function HomePage() {
  const { user } = useAuth();
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [showCallPopup, setShowCallPopup] = useState(false);

  // When non-logged visitor scrolls to mentors section — show signup popup once per session
  const handleReachMentors = () => {
    if (!user && !sessionStorage.getItem("popupShown")) {
      setShowSignupPopup(true);
      sessionStorage.setItem("popupShown", "true");
    }
  };

  return (
    <div>
      {/* Always visible sections */}
      <HeroSection />
      <AboutSection />
      <AchievementsSection />
      <CoursesSection />
      <QuotesSection />

      {/* Mentors section — visible to all, but triggers popup for non-logged */}
      <MentorsSection onReachMentors={handleReachMentors} />

      {/* Everything below Mentors is ONLY visible to logged-in users */}
      {user ? (
        <>
          <StudentLifeSection />
          <EventsGallery />
          <CounselorCTA onOpenCall={() => setShowCallPopup(true)} />
          <HiringStatsSection />
          <Footer />
        </>
      ) : (
        /* For non-logged users, show a teaser section prompting signup */
        <section className="py-0 bg-cream text-center ">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
              Want to See More?
            </h2>
            <p className="text-gray-500 mb-8">
              Sign up to explore campus life, events, placement statistics, and talk to our AI counselor.
            </p>
            <button
              onClick={() => setShowSignupPopup(true)}
              className="bg-maroon text-white px-8 py-3 rounded-lg font-semibold hover:bg-maroon-dark transition-colors duration-200 mb-8"
            >
              Sign Up to Unlock
            </button>
          </div>
          <Footer />
        </section>
      )}

      {/* Popups */}
      <SignupPopup show={showSignupPopup} onClose={() => setShowSignupPopup(false)} />
      <CallPopup open={showCallPopup} onClose={() => setShowCallPopup(false)} />
    </div>
  );
}