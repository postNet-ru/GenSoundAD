import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "../../page/Index";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
