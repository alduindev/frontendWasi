import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Contact from "./Contact";
import Features from "./Features";
import Landing from "./LandingCarousel";
import Pricing from "./Pricing";
import PublicInfo from "./PublicInfo";
import PublicLayout from "../../components/public/PublicLayout";

const tabs = {
  home: <Landing embedded />,
  features: <Features embedded />,
  pricing: <Pricing embedded />,
  about: <PublicInfo embedded type="about" />,
  contact: <Contact embedded />,
  help: <PublicInfo embedded type="help" />,
};

function getTab(requestedTab = "") {
  return requestedTab in tabs ? requestedTab : "home";
}

export default function PublicHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const legacyTab =
    new URLSearchParams(location.search).get("tab") ||
    location.hash.replace(/^#/, "");
  const activeTab = getTab(location.state?.publicTab || legacyTab);

  useEffect(() => {
    if (location.pathname === "/" && (location.search || location.hash)) {
      navigate("/", {
        replace: true,
        state: activeTab === "home" ? undefined : { publicTab: activeTab },
      });
      return;
    }

    window.scrollTo(0, 0);
  }, [activeTab, location.hash, location.pathname, location.search, navigate]);

  return <PublicLayout compactFooter homeShell={activeTab === "home"}>{tabs[activeTab]}</PublicLayout>;
}