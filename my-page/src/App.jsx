import React, { useState, useRef, useEffect } from "react";
import { useMediaQuery } from "react-responsive";

import "./App.css";
import ReactMarkdown from "react-markdown";
import { MarkdownTypewriter } from "react-markdown-typewriter";
import { isMobile, isTablet, isDesktop } from "react-device-detect";

import { AuroraText } from "@/components/magicui/aurora-text";
import { AnimatePresence, motion } from "framer-motion";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Pointer } from "@/components/magicui/pointer";
import { Textarea } from "./components/ui/textarea";
import {
  Send,
  File as FileIcon,
  Linkedin,
  Github,
  Paperclip,
  Settings,
  FileText,
  EllipsisVertical,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { ShinyButton } from "./components/magicui/shiny-button";
import { GridPattern } from "@/components/magicui/grid-pattern";
import { cn } from "./lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";

import { Switch } from "./components/ui/switch";
import { Label } from "@radix-ui/react-label";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import remarkGfm from "remark-gfm";
import ReactGA from "react-ga4";

import avatarImage from "../files/avatarimage.png";
import resumePdf from "../files/nbk-resume.pdf";

function App() {
  const HUMANMESSAGE = 1;
  const AIMESSAGE = 0;
  const GA_KEY = import.meta.env.VITE_GA_KEY;

  const [token, setToken] = useState("");

  const isTouchPrimary = isMobile || isTablet;
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });

  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const [isChatMode, setIsChatMode] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [text, setText] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const fileInputDummy = useRef(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isChatWritten, setIsChatWritten] = useState(true);

  const isSmallLandscape = useMediaQuery({
    query: "(max-width: 790px) and (orientation: landscape)",
  });

  const isShortScreen = useMediaQuery({
    query: "(max-height: 380px) and (orientation: landscape)",
  });

  const audioRef = useRef(null);
  const chatEndRef = useRef(null);

  const words = ["Nideesh", "GPT"];
  const prompts = [
    "Can you summarize Nideesh’s background in 3–5 sentences? I'm looking for a clear snapshot of his education, work experience, notable projects, and any awards or competitions he's been part of. Something that gives me a quick but strong sense of his professional profile.",

    "How does Nideesh compare to other candidates at a similar stage in their career? Include data or typical benchmarks for skills, experience, or accomplishments in his field, and describe where he currently stands relative to those.",

    "Here’s a job description — based on this, how does Nideesh’s background align with the requirements and expectations? Describe where his experience matches and where there may be gaps.\n\nJob Description:\n[Paste job description here]",

    "Tell me a fun or surprising fact about Nideesh — something authentic that reflects his personality or sparks curiosity. Could be a hobby, unusual experience, or just something memorable that breaks the ice.",

    "What are some of Nideesh’s favorite songs? Share 5–7 tracks across different genres or moods if you can — I want to get a casual sense of his personality through the kind of music he enjoys.",
  ];

  const [messages, setMessages] = useState([
  [HUMANMESSAGE, "How to jerk", null],
  [AIMESSAGE, "I'm not sure which \"jerk\" you're referring to. The Jamaican **jerk cooking** technique?", null],
  [HUMANMESSAGE, "Something else", null],
  [AIMESSAGE, "I'm sorry, but I can't help with that.", null],
  [HUMANMESSAGE, "Ok", null],
  [AIMESSAGE, "Sure! If you have any other questions—whether about Nideesh's background, projects, technical skills, or anything else I can help with—just let me know.", null]
]);

  function handleChangeToMain() {
    setIsIntroVisible(false);
  }

  function handleTextChange(e) {
    if (e.target.value.length <= 1500) {
      setText(e.target.value);
    }
  }

  function handleTextEnter(e) {
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  }

  function handleFileClick() {
    if (fileInputDummy.current) {
      fileInputDummy.current.value = null;
    }

    fileInputDummy.current.click();
  }

  function handleFileChange(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (file.type != "application/pdf") {
      alert("Please upload a PDF.");
      return;
    }

    setFile(file);
    setFileName(file.name);
  }

  function handleMusicToggle() {
    setMusicOn((prev) => {
      if (prev) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }

      return !prev;
    });
  }

  function handleTextareaBlur() {
    if (isTouchPrimary) {
      setTimeout(() => {
        window.scrollTo(0, 0);
      });
    }
  }

  async function handleChatResponse(messagesState) {
    let formData = new FormData();

    if (file) {
      formData.append("file", file);
    }

    formData.append(
      "messages",
      JSON.stringify({
        messages: [
          ...messagesState.map(([type, text]) => ({
            role: type == HUMANMESSAGE ? "user" : "assistant",
            content: text,
          })),
        ],
      })
    );

    formData.append("tkn", token);

    try {
      const response = await fetch(
        "https://portfolio-backend-xs4b.onrender.com/chat",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        return "Error during llm generation";
      }

      const result = await response.json();

      return result.content;
    } catch {
      return "Error during llm generation";
    }
  }

  async function getChatId() {
    try {
      const response = await fetch(
        "https://portfolio-backend-xs4b.onrender.com/token",
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        return "Error during token generation";
      }

      const result = await response.json();

      return result.id;
    } catch {
      return "Error during token generation";
    }
  }

  async function handleTextSubmit() {
    if (text) {
      const sent = text;
      let sentFile = null;

      if (file) {
        sentFile = file.name;
      }

      setIsChatMode(true);
      setIsChatWritten((prev) => !prev);
      setText("");
      setIsChatLoading((prev) => !prev);
      setFile(null);

      const formatSent = [HUMANMESSAGE, sent, sentFile];

      setMessages((prev) => [...prev, formatSent]);

      let response = [
        AIMESSAGE,
        await handleChatResponse([...messages, formatSent]),
        null,
      ];

      setMessages((prev) => [...prev, response]);

      setIsChatLoading(false);
    }
  }

  function MessageBubble({ message, messageIndex }) {
    let type = message[0];
    let text = message[1];
    let sentFile = message[2];
    let lastMessage = messages.length == messageIndex + 1;

    if (type == HUMANMESSAGE) {
      return (
        <>
          <div className="relative flex justify-end lg:pr-2 portrait:pl-10 cursor-none">
            <Card className="w-fit h-fit px-7 py-4 bg-blue-100 4xl:px-12 4xl:py-6 4xl:border-4 4xl:rounded-3xl">
              <article className="prose prose-sm 4xl:prose-2xl whitespace-normal break-words cursor-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table
                          className="min-w-full border-collapse border border-gray-300"
                          {...props}
                        >
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children, ...props }) => (
                      <thead className="bg-gray-50" {...props}>
                        {children}
                      </thead>
                    ),
                    th: ({ children, ...props }) => (
                      <th
                        className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900"
                        {...props}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td
                        className="border border-gray-300 px-4 py-2 text-gray-700"
                        {...props}
                      >
                        {children}
                      </td>
                    ),
                    tbody: ({ children, ...props }) => (
                      <tbody {...props}>{children}</tbody>
                    ),
                    tr: ({ children, ...props }) => (
                      <tr
                        className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
                        {...props}
                      >
                        {children}
                      </tr>
                    ),
                    a: ({ children, ...props }) => (
                      <a className="cursor-none" {...props}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {text}
                </ReactMarkdown>
              </article>
            </Card>
            {sentFile && (
              <div className="absolute -bottom-3 right-0 4xl:-bottom-5 *:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 border-2 shadow-sm rounded-full">
                <Tooltip className="cursor-none">
                  <TooltipTrigger className="cursor-none">
                    <Avatar className="w-5 h-5 4xl:w-10 4xl:h-10">
                      <AvatarImage src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='-6 -6 36 36' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='background-color:white'%3E%3Cpath d='m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551'/%3E%3C/svg%3E" />
                      <AvatarFallback>File</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="cursor-none 4xl:rounded-2xl"
                  >
                    <p className="4xl:text-2xl 4xl:px-3 4xl:py-2">{sentFile}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
          {lastMessage && isChatLoading && (
            <div
              className="relative pl-2 portrait:pr-10 cursor-none"
              {...(lastMessage ? { ref: chatEndRef } : {})}
            >
              <Card className="w-fit h-fit px-7 py-4 4xl:px-12 4xl:py-6 4xl:border-4 4xl:rounded-3xl">
                <article className="prose prose-sm 4xl:prose-2xl animate-wiggle animate-pulse animate-ease-in-out whitespace-normal break-words cursor-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ children, ...props }) => (
                        <div className="overflow-x-auto my-4">
                          <table
                            className="min-w-full border-collapse border border-gray-300"
                            {...props}
                          >
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children, ...props }) => (
                        <thead className="bg-gray-50" {...props}>
                          {children}
                        </thead>
                      ),
                      th: ({ children, ...props }) => (
                        <th
                          className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900"
                          {...props}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ children, ...props }) => (
                        <td
                          className="border border-gray-300 px-4 py-2 text-gray-700"
                          {...props}
                        >
                          {children}
                        </td>
                      ),
                      tbody: ({ children, ...props }) => (
                        <tbody {...props}>{children}</tbody>
                      ),
                      tr: ({ children, ...props }) => (
                        <tr
                          className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
                          {...props}
                        >
                          {children}
                        </tr>
                      ),
                      a: ({ children, ...props }) => (
                        <a className="cursor-none" {...props}>
                          {children}
                        </a>
                      ),
                    }}
                  >
                    Generating...
                  </ReactMarkdown>
                </article>
              </Card>
              <div className="absolute -top-3 -left-4 4xl:-top-5 4xl:-left-6 *:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 ">
                <Avatar className="w-10 h-10 4xl:w-17 4xl:h-17">
                  <AvatarImage src={avatarImage} />
                  <AvatarFallback>NBK</AvatarFallback>
                </Avatar>
              </div>
            </div>
          )}
        </>
      );
    } else if (type == AIMESSAGE) {
      return (
        <div
          className="relative pl-2 portrait:pr-10"
          {...(lastMessage ? { ref: chatEndRef } : {})}
        >
          <Card className="w-fit h-fit px-7 py-4 4xl:px-12 4xl:py-6 4xl:border-4 4xl:rounded-3xl">
            <article className="prose prose-sm 4xl:prose-2xl whitespace-normal break-words cursor-none">
              {!lastMessage ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table
                          className="min-w-full border-collapse border border-gray-300"
                          {...props}
                        >
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children, ...props }) => (
                      <thead className="bg-gray-50" {...props}>
                        {children}
                      </thead>
                    ),
                    th: ({ children, ...props }) => (
                      <th
                        className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900"
                        {...props}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td
                        className="border border-gray-300 px-4 py-2 text-gray-700"
                        {...props}
                      >
                        {children}
                      </td>
                    ),
                    tbody: ({ children, ...props }) => (
                      <tbody {...props}>{children}</tbody>
                    ),
                    tr: ({ children, ...props }) => (
                      <tr
                        className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
                        {...props}
                      >
                        {children}
                      </tr>
                    ),
                    a: ({ children, ...props }) => (
                      <a className="cursor-none" {...props}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {text}
                </ReactMarkdown>
              ) : isChatLoading ? (
                <></>
              ) : !isChatWritten ? (
                <MarkdownTypewriter
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table
                          className="min-w-full border-collapse border border-gray-300"
                          {...props}
                        >
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children, ...props }) => (
                      <thead className="bg-gray-50" {...props}>
                        {children}
                      </thead>
                    ),
                    th: ({ children, ...props }) => (
                      <th
                        className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900"
                        {...props}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td
                        className="border border-gray-300 px-4 py-2 text-gray-700"
                        {...props}
                      >
                        {children}
                      </td>
                    ),
                    tbody: ({ children, ...props }) => (
                      <tbody {...props}>{children}</tbody>
                    ),
                    tr: ({ children, ...props }) => (
                      <tr
                        className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
                        {...props}
                      >
                        {children}
                      </tr>
                    ),
                    a: ({ children, ...props }) => (
                      <a className="cursor-none" {...props}>
                        {children}
                      </a>
                    ),
                  }}
                  motionProps={{
                    onAnimationComplete: () =>
                      setIsChatWritten((prev) => !prev),
                  }}
                >
                  {text}
                </MarkdownTypewriter>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table
                          className="min-w-full border-collapse border border-gray-300"
                          {...props}
                        >
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children, ...props }) => (
                      <thead className="bg-gray-50" {...props}>
                        {children}
                      </thead>
                    ),
                    th: ({ children, ...props }) => (
                      <th
                        className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900"
                        {...props}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td
                        className="border border-gray-300 px-4 py-2 text-gray-700"
                        {...props}
                      >
                        {children}
                      </td>
                    ),
                    tbody: ({ children, ...props }) => (
                      <tbody {...props}>{children}</tbody>
                    ),
                    tr: ({ children, ...props }) => (
                      <tr
                        className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
                        {...props}
                      >
                        {children}
                      </tr>
                    ),
                    a: ({ children, ...props }) => (
                      <a className="cursor-none" {...props}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {text}
                </ReactMarkdown>
              )}
            </article>
          </Card>
          <div className="absolute -top-3 -left-4 4xl:-top-5 4xl:-left-6 *:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 ">
            <Avatar className="w-10 h-10 4xl:w-17 4xl:h-17">
              <AvatarImage src={avatarImage} />
              <AvatarFallback>NBK</AvatarFallback>
            </Avatar>
          </div>
        </div>
      );
    }

    return <></>;
  }

  useEffect(() => {
    const fetchChatId = async () => {
      const temp = await getChatId();
      setToken(temp);
    };

    fetchChatId();
  }, []);

  useEffect(() => {
    ReactGA.initialize(GA_KEY);
    ReactGA.send("pageview");
  }, []);

  useEffect(() => {
    const handleTabFocus = () => {
      if (musicOn) {
        if (document.hidden) {
          audioRef.current?.pause();
        } else {
          audioRef.current?.play();
        }
      }
    };

    document.addEventListener("visibilitychange", handleTabFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleTabFocus);
    };
  }, [musicOn]);

  useEffect(() => {
    audioRef.current?.play().catch(() => {
      const catchInteract = () => {
        audioRef.current?.play();
        document.removeEventListener("mousemove", catchInteract);
      };

      document.addEventListener("mousemove", catchInteract, { once: true });
    });
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.5,
        delayChildren: 0.7,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
  };

  const gridDimensions = window.innerWidth < 2560 ? 70 : 140;

  return (
    <div
      className={`min-h-dvh portrait:h-dvh flex flex-col items-center justify-center gap-y-8 relative bg-blue-50/50 overflow-hidden`}
    >
      <GridPattern
        width={gridDimensions}
        height={gridDimensions}
        x={-1}
        y={-1}
        className={cn("fixed inset-0 -z-10 w-full h-full")}
      />
      <motion.div
        className="absolute -z-10 w-35 h-35 portrait:top-[0%] portrait:left[100%] portrait:w-[25vh] portrait:h-[25vh] portrait:blur-3xl portrait:bg-blue-400/50 blur-lg lg:w-70 lg:h-70 lg:blur-lg 4xl:w-110 4xl:h-110 4xl:blur-xl bg-blue-400 rounded-full top-[30%] left-[85%] transform -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>
      <motion.div
        className="absolute -z-10 w-30 h-30 portrait:top-[100%] portrait:left[0%] portrait:w-[25vh] portrait:h-[25vh] portrait:blur-3xl portrait:bg-purple-400/50 blur-lg lg:w-50 lg:h-50 lg:blur-lg 4xl:w-90 4xl:h-90 4xl:blur-2xl bg-purple-400 rounded-full top-[80%] left-[20%] transform -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>
      <motion.div
        className="absolute -z-10 w-40 h-40 portrait:top-[100%] portrait:left[100%] portrait:w-[25vh] portrait:h-[25vh] portrait:blur-3xl portrait:bg-green-400/50 blur-2xl lg:w-60 lg:h-60 lg:blur-2xl 4xl:w-100 4xl:h-100 4xl:blur-2xl bg-green-400 rounded-full top-[80%] left-[90%] transform -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>
      <motion.div
        className="absolute -z-10 w-15 h-15 portrait:top-[0%] portrait:left[0%] portrait:w-[25vh] portrait:h-[25vh] portrait:blur-3xl portrait:bg-pink-400/25 blur-lg lg:w-30 lg:h-30 lg:blur-lg 4xl:w-70 4xl:h-70 4xl:blur-2xl bg-pink-400 rounded-full top-[40%] left-[10%] transform -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>
      <AnimatePresence mode="wait">
        {isIntroVisible ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-y-8 4xl:gap-y-20"
          >
            <motion.h1
              className="text-5xl font-bold tracking-tighter md:text-7xl lg:text-9xl 4xl:text-[14rem] text-center transform transition-transform duration-300 ease-in-out hover:scale-105 flex justify-center"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
              onClick={() => handleChangeToMain()}
            >
              {words.map((word, idx) => (
                <motion.span
                  key={idx}
                  className="inline-block mr-2"
                  variants={wordVariants}
                  transition={{ duration: 0.5, ease: "easeIn" }}
                >
                  {word === "GPT" ? (
                    <AuroraText>{word}</AuroraText>
                  ) : (
                    <p>{word}</p>
                  )}
                </motion.span>
              ))}
            </motion.h1>

            <TextAnimate
              className={`text-sm sm:text-md md:text-2xl text-gray-700 lg:text-xl 4xl:text-4xl`}
              delay={2.2}
            >
              Click above to learn more, if you want ¯\_(ツ)_/¯
            </TextAnimate>
          </motion.div>
        ) : (
          <>
            <audio
              ref={audioRef}
              src="https://hollow-knight-bucket.s3.us-east-2.amazonaws.com/vibe.mp3"
              autoPlay
              loop
              preload="auto"
            />
            {!isPortrait && !isSmallLandscape && (
              <div>
                <a
                  href="https://www.linkedin.com/in/bknideesh/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="fixed top-4 left-4 4xl:top-8 4xl:left-8 4xl:pt-9 4xl:pb-9 4xl:pl-8 4xl:pr-8 4xl:rounded-2xl 4xl:text-[1.7rem] cursor-none bg-[#008FD6] hover:scale-105 hover:opacity-80 hover:bg-[#008FD6] hover:shadow-2xl animate-in fade-in-0 slide-in-from-top-20 duration-500">
                    <span className="flex flex-row space-x-4 4xl:space-x-8 items-center">
                      <Linkedin
                        strokeWidth={2}
                        className="h-4 w-4 4xl:h-8 4xl:w-8"
                      />
                      <p>Connect on LinkedIn</p>
                    </span>
                  </Button>
                </a>
                <a
                  href="https://github.com/nb923"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="fixed top-4 left-55 4xl:top-8 4xl:left-110 4xl:pt-9 4xl:pb-9 4xl:pl-8 4xl:pr-8 4xl:rounded-2xl 4xl:text-[1.7rem] cursor-none bg-gray-800 hover:scale-105 hover:opacity-80 hover:bg-gray-800 hover:shadow-2xl animate-in fade-in-0 slide-in-from-top-20 duration-500">
                    <span className="flex flex-row space-x-4 items-center">
                      <Github
                        strokeWidth={2}
                        className="h-4 w-4 4xl:h-8 4xl:w-8"
                      />
                      <p>View GitHub</p>
                    </span>
                  </Button>
                </a>
                <a href={resumePdf} target="_blank" rel="noopener noreferrer">
                  <Button className="fixed top-4 right-4 4xl:top-8 4xl:right-8 4xl:pt-9 4xl:pb-9 4xl:pl-8 4xl:pr-8 4xl:rounded-2xl 4xl:text-[1.7rem] cursor-none bg-blue-500 hover:scale-105 hover:opacity-80 hover:bg-blue-500 hover:shadow-2xl animate-in fade-in-0 slide-in-from-top-20 duration-500">
                    <span className="flex flex-row space-x-4 items-center">
                      <FileIcon
                        strokeWidth={2}
                        className="h-4 w-4 4xl:h-8 4xl:w-8"
                      />
                      <p>Resume</p>
                    </span>
                  </Button>
                </a>
              </div>
            )}
            {!isPortrait && !isSmallLandscape && (
              <Popover>
                <PopoverTrigger asChild className="4xl:border-2">
                  <Button
                    variant="outline"
                    className="fixed bottom-4 left-4 4xl:bottom-8 4xl:left-8 4xl:p-8 4xl:pl-16 4xl:pr-16 4xl:text-[1.7rem] cursor-none rounded-full animate-in fade-in-0 slide-in-from-top-20 duration-500"
                  >
                    <Settings className="h-4 w-4 4xl:h-8 4xl:w-8 4xl:m-10 4xl:ml-2 4xl:mr-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  className="w-80 ml-0 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-2"
                  sideOffset={5}
                  alignOffset={0}
                >
                  <div className="4xl:border-2 gap-4 p-4 rounded-2xl border bg-background shadow-xs flex flex-col w-49 4xl:w-90 4xl:p-8 4xl:rounded-4xl 4xl:gap-8">
                    <span className="flex items-center space-x-2 4xl:space-x-4">
                      <Switch
                        className="data-[state=checked]:bg-blue-500 cursor-none"
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                        disabled={!isChatWritten}
                      />
                      <Label className="text-sm 4xl:text-[1.7rem] cursor-none relative bottom-[2px]">
                        Dark Mode TBD
                      </Label>
                    </span>
                    <span className="flex items-center space-x-2 4xl:space-x-4">
                      <Switch
                        className="data-[state=checked]:bg-blue-500 cursor-none"
                        checked={musicOn}
                        onCheckedChange={handleMusicToggle}
                        disabled={!isChatWritten}
                      />
                      <Label className="text-sm 4xl:text-[1.7rem] cursor-none relative bottom-[2px] flex flex-row space-x-1 4xl:space-x-2">
                        <a
                          href="https://www.youtube.com/watch?v=_Q8Ih2SW-TE"
                          className="cursor-none text-blue-500 underline underline-offset-3"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Music
                        </a>
                        <p>Toggle</p>
                      </Label>
                    </span>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {isChatMode && (
              <div
                className={`fixed overflow-y-auto pl-8 py-1 scrollbar-none space-y-8 text-base animate-in fade-in-0 duration-500 max-h-dvh   ${
                  isSmallLandscape
                    ? `top-16 bottom-33 left-3 right-8 -translate-x-0`
                    : `top-16 bottom-35 not-portrait:w-150 lg:top-14 lg:bottom-35 portrait:top-20 portrait:bottom-25 portrait:left-5 portrait:right-0 ${
                        !isPortrait &&
                        "lg:w-221 4xl:w-401 4xl:top-30 4xl:bottom-70"
                      } -translate-x-5`
                }`}
              >
                {messages.map((item, i) => (
                  <MessageBubble key={i} message={item} messageIndex={i} />
                ))}
              </div>
            )}
            {isSmallLandscape && (
              <>
                <h1
                  onClick={() => setIsIntroVisible(false)}
                  className={`portrait:fixed portrait:top-3 portrait:left-3 portrait:text-3xl text-3xl font-bold tracking-tighter md:text-3xl lg:text-6xl 4xl:text-9xl text-center flex justify-center ${
                    !isPortrait && isChatMode && !isSmallLandscape
                      ? "opacity-0 pointer-events-none overflow-hidden"
                      : "opacity-100 h-auto"
                  } ${isSmallLandscape && "fixed top-3 left-3 text-3xl"}`}
                >
                  {words.map((word, idx) => (
                    <motion.span
                      layout
                      key={idx}
                      className={`inline-block ${
                        isSmallLandscape ? "mr-0.5" : "mr-1.5"
                      } portrait:mr-1`}
                      variants={wordVariants}
                      transition={{ duration: 0.5, ease: "easeIn" }}
                    >
                      {word === "GPT" ? (
                        <AuroraText>{word}</AuroraText>
                      ) : (
                        <p>{word}</p>
                      )}
                    </motion.span>
                  ))}
                </h1>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="fixed top-4 right-3 bg-transparent shadow-none border-none w-7 h-7">
                      <EllipsisVertical
                        strokeWidth={2}
                        className="h-7 w-7 text-black"
                      />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                      <DialogTitle>Settings</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Dark Mode TBD</Label>
                        <Switch
                          className="data-[state=checked]:bg-blue-500"
                          checked={darkMode}
                          onCheckedChange={setDarkMode}
                          disabled={!isChatWritten}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <a
                            href="https://www.youtube.com/watch?v=_Q8Ih2SW-TE"
                            className="text-blue-500 underline text-sm"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Music
                          </a>
                        </div>
                        <Switch
                          className="data-[state=checked]:bg-blue-500"
                          checked={musicOn}
                          onCheckedChange={handleMusicToggle}
                          disabled={!isChatWritten}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <Button
                        asChild
                        className="w-full h-9 bg-[#008FD6] hover:bg-[#007BC4] text-white"
                      >
                        <a
                          href="https://www.linkedin.com/in/bknideesh/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span>LinkedIn</span>
                        </a>
                      </Button>

                      <Button
                        asChild
                        className="w-full h-9 bg-gray-800 hover:bg-gray-700 text-white"
                      >
                        <a
                          href="https://github.com/nb923"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2"
                        >
                          <Github className="h-4 w-4" />
                          <span>GitHub</span>
                        </a>
                      </Button>

                      <Button
                        asChild
                        className="w-full h-9 bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <a
                          href={resumePdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2"
                        >
                          <FileIcon className="h-4 w-4" />
                          <span>Resume</span>
                        </a>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <motion.div
              layout="position"
              key="main"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                layout: { duration: 1, ease: "easeInOut" },
              }}
              className={`flex flex-col items-center gap-y-4 lg:gap-y-8 4xl:gap-y-14 portrait:w-full portrait:justify-end portrait:h-dvh portrait:pb-30 ${
                !isPortrait && isChatMode && !file && !isSmallLandscape
                  ? "fixed -bottom-18 lg:-bottom-28 4xl:-bottom-47"
                  : ""
              }
              
              ${
                !isPortrait && isChatMode && file && !isSmallLandscape
                  ? " fixed -bottom-13 lg:-bottom-23 4xl:-bottom-42"
                  : ""
              }

              ${
                isSmallLandscape &&
                (!file
                  ? "fixed bottom-1 left-3 right-3"
                  : "fixed bottom-5 left-3 right-3")
              }
              `}
            >
              {!isSmallLandscape && (
                <h1
                  onClick={() => setIsIntroVisible(false)}
                  className={`portrait:fixed portrait:top-3 portrait:left-4 portrait:text-3xl text-3xl font-bold tracking-tighter md:text-3xl lg:text-6xl 4xl:text-9xl text-center flex justify-center ${
                    !isPortrait && isChatMode && !isSmallLandscape
                      ? "opacity-0 pointer-events-none overflow-hidden"
                      : "opacity-100 h-auto"
                  }`}
                >
                  {words.map((word, idx) => (
                    <motion.span
                      layout
                      key={idx}
                      className="inline-block mr-1.5 portrait:mr-0.5"
                      variants={wordVariants}
                      transition={{ duration: 0.5, ease: "easeIn" }}
                    >
                      {word === "GPT" ? (
                        <AuroraText>{word}</AuroraText>
                      ) : (
                        <p>{word}</p>
                      )}
                    </motion.span>
                  ))}
                </h1>
              )}
              {(isPortrait || isSmallLandscape) && !isChatMode && (
                <motion.div
                  layout="position"
                  className={`flex flex-col w-full flex-end ${
                    isChatMode
                      ? "opacity-0 pointer-events-none overflow-hidden"
                      : "opacity-100 h-auto"
                  } ${file ? "portrait:pb-5" : ""} ${isPortrait && "px-5"}`}
                >
                  <div className="relative">
                    <div className="flex overflow-x-auto scrollbar-none gap-2 pb-0 snap-start snap-x snap-mandatory scroll-smooth">
                      {prompts.map((prompt, index) => {
                        const labels = [
                          "Summarize my experience",
                          "Compare me to peers",
                          "Explain my role fit",
                          "Share a fun fact about me",
                          "List my favorite songs",
                        ];

                        return (
                          <button
                            key={index}
                            className="flex-shrink-0 snap-start bg-white/90 border-1 border-gray-300 rounded-full px-4 py-2.5 text-sm font-normal text-[rgb(0,0,0,75%)] hover:bg-white active:scale-95 transition-all duration-200 whitespace-nowrap"
                            onClick={() => setText(prompt)}
                          >
                            {labels[index]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
              {isPortrait && !isSmallLandscape && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="fixed top-4 right-2 bg-transparent shadow-none border-none w-7 h-7">
                        <EllipsisVertical
                          strokeWidth={2}
                          className="h-7 w-7 text-black"
                        />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[350px]">
                      <DialogHeader>
                        <DialogTitle>Settings</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Dark Mode TBD</Label>
                          <Switch
                            className="data-[state=checked]:bg-blue-500"
                            checked={darkMode}
                            onCheckedChange={setDarkMode}
                            disabled={!isChatWritten}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <a
                              href="https://www.youtube.com/watch?v=_Q8Ih2SW-TE"
                              className="text-blue-500 underline text-sm"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Music
                            </a>
                          </div>
                          <Switch
                            className="data-[state=checked]:bg-blue-500"
                            checked={musicOn}
                            onCheckedChange={handleMusicToggle}
                            disabled={!isChatWritten}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t">
                        <Button
                          asChild
                          className="w-full h-9 bg-[#008FD6] hover:bg-[#007BC4] text-white"
                        >
                          <a
                            href="https://www.linkedin.com/in/bknideesh/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2"
                          >
                            <Linkedin className="h-4 w-4" />
                            <span>LinkedIn</span>
                          </a>
                        </Button>

                        <Button
                          asChild
                          className="w-full h-9 bg-gray-800 hover:bg-gray-700 text-white"
                        >
                          <a
                            href="https://github.com/nb923"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2"
                          >
                            <Github className="h-4 w-4" />
                            <span>GitHub</span>
                          </a>
                        </Button>

                        <Button
                          asChild
                          className="w-full h-9 bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <a
                            href={resumePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2"
                          >
                            <FileIcon className="h-4 w-4" />
                            <span>Resume</span>
                          </a>
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              <motion.div
                layout="position"
                className={`portrait:fixed portrait:left-5 portrait:right-5 flex z-10 flex-col ${
                  file ? "portrait:bottom-5" : "portrait:bottom-3"
                } ${isSmallLandscape && "w-full"}`}
              >
                <div className="flex flex-row">
                  <Textarea
                    disabled={!isChatWritten}
                    className={`h-20 portrait:w-full ${
                      isSmallLandscape
                        ? "w-full"
                        : isShortScreen
                        ? "sm:w-100"
                        : "w-150"
                    } lg:w-200 4xl:w-370 4xl:h-40 4xl:text-[1.7rem] 4xl:rounded-2xl 4xl:p-4 4xl:pl-6 text-left resize-none scrollbar-thin scroll-smooth cursor-none border-gray-300 4xl:border-2 text-[rgb(0,0,0,75%)] bg-white`}
                    placeholder="Ask me anything... this agent knows my resume better than I do"
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleTextEnter}
                    onBlur={handleTextareaBlur}
                  />
                  <div className="flex flex-col ml-2 space-y-2 4xl:space-y-4 4xl:ml-4">
                    <Button
                      onClick={handleTextSubmit}
                      disabled={!isChatWritten}
                      className="h-9 w-9 4xl:w-18 4xl:h-18 4xl:rounded-2xl bg-blue-500 border border-blue-500 4xl:border-2 cursor-none transform transition-transform duration-100 hover:scale-110 hover:bg-blue-500"
                    >
                      <Send className="h-4 w-4 4xl:h-8 4xl:w-8" />
                    </Button>
                    <>
                      <Button
                        disabled={!isChatWritten}
                        className="h-9 w-9 4xl:w-18 4xl:h-18 4xl:rounded-2xl bg-white border border-gray-300 4xl:border-2 cursor-none transform transition-transform duration-100 hover:scale-110 hover:bg-white"
                        onClick={handleFileClick}
                      >
                        <Paperclip
                          className="h-4 w-4 4xl:h-8 4xl:w-8"
                          color="black"
                        />
                      </Button>
                      <input
                        type="file"
                        accept=".pdf, application/pdf"
                        onChange={handleFileChange}
                        ref={fileInputDummy}
                        style={{ display: "none" }}
                      />
                    </>
                  </div>
                </div>
                {file && (
                  <div className="flex flex-row items-center border border-blue-300 bg-blue-100 rounded-sm pl-3 mt-1 -mb-3 4xl:pl-6 4xl:mt-2 4xl:-mb-1 4xl:pt-2 4xl:pb-2 4xl:border-2 4xl:rounded-xl w-fit animate-in fade-in-0 duration-600">
                    <div className="rounded-full bg-blue-500 h-1.5 w-1.5 mr-2 4xl:w-3 4xl:h-3 4xl:mr-4" />
                    <p className="text-[0.71rem] 4xl:text-[1.33rem] relative font-semibold text-blue-950">
                      {fileName}
                    </p>
                    <button
                      className="relative bottom-[1px] text-blue-950 cursor-none pl-2 pr-3 4xl:pl-4 4xl:pr-6 4xl:text-2xl 4xl:bottom-[3px]"
                      onClick={() => setFile(null)}
                    >
                      ×
                    </button>
                  </div>
                )}
                {!isPortrait && !isSmallLandscape && (
                  <motion.div
                    layout="position"
                    className={`4xl:space-y-4 ${
                      isChatMode
                        ? isShortScreen
                          ? file
                            ? "pt-3 opacity-0 pointer-events-none overflow-hidden"
                            : "pt-11 opacity-0 pointer-events-none overflow-hidden"
                          : "opacity-0 pointer-events-none overflow-hidden"
                        : "opacity-100 h-auto"
                    }`}
                  >
                    <div
                      className={`flex justify-center lg:pt-10 space-x-4 ${
                        file &&
                        (isShortScreen
                          ? "pt-6 lg:pt-16"
                          : "md:pt-0 not-lg:pt-6")
                      }`}
                    >
                      <ShinyButton
                        variant="outline"
                        className="cursor-none rounded-3xl bg-white 4xl:p-4 4xl:pl-12 4xl:pr-12 4xl:rounded-full 4xl:border-2"
                        onClick={() => setText(prompts[0])}
                      >
                        Summarize my experience
                      </ShinyButton>
                      <ShinyButton
                        variant="outline"
                        className="cursor-none rounded-3xl bg-white 4xl:p-4 4xl:pl-12 4xl:pr-12 4xl:rounded-full 4xl:border-2"
                        onClick={() => setText(prompts[1])}
                      >
                        Compare me to peers
                      </ShinyButton>
                    </div>
                    {!isShortScreen && (
                      <div className="flex justify-center pt-2 space-x-4 4xl:space-x-8">
                        <ShinyButton
                          variant="outline"
                          className="cursor-none rounded-3xl bg-white 4xl:p-4 4xl:pl-12 4xl:pr-12 4xl:rounded-full 4xl:border-2"
                          onClick={() => setText(prompts[2])}
                        >
                          Explain my role fit
                        </ShinyButton>
                        <ShinyButton
                          variant="outline"
                          className="cursor-none rounded-3xl bg-white 4xl:p-4 4xl:pl-12 4xl:pr-12 4xl:rounded-full 4xl:border-2"
                          onClick={() => setText(prompts[3])}
                        >
                          Share a fun fact about me
                        </ShinyButton>
                        <ShinyButton
                          variant="outline"
                          className="cursor-none rounded-3xl bg-white 4xl:p-4 4xl:pl-12 4xl:pr-12 4xl:rounded-full 4xl:border-2"
                          onClick={() => setText(prompts[4])}
                        >
                          List my favorite songs
                        </ShinyButton>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {!isTouchPrimary && (
        <Pointer>
          <div className="text-4xl 4xl:text-4xl">👆</div>
        </Pointer>
      )}
    </div>
  );
}

export default App;

/*

, if you want ¯\_(ツ)_/¯

*/
