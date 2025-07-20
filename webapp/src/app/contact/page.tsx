"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { CiLocationOn, CiPhone, CiTimer, CiUser } from "react-icons/ci";
import { RiTeamLine } from "react-icons/ri";

import Button from "@/components/Button";
import Icon from '@/components/Icon';
import Heading from "@/components/Heading";
import Input from '@/components/Input';
import tan from "@/assets/images/tan.png";
import prakhar from "@/assets/images/prakhar.jpeg";
import martynas from "@/assets/images/martynas.jpeg";
import neasa from "@/assets/images/neasa.jpeg";
import billie from "@/assets/images/billie.jpeg";

const team = [
  { 'name': 'Martynas', 'pic': martynas, title: 'Coordination lead', 'email': "martynas.kapocius@ucdconnect.ie" }, 
  { 'name': 'Neasa', 'pic': neasa, title: 'Data lead', 'email': "neasa.nifhatharta2@ucdconnect.ie" },
  { 'name': 'Zhaofang He', 'pic': billie, title: 'Maintenance', 'email': "zhaofang.he@ucdconnect.ie" },
  { 'name': 'Hsuan-Yu Tan', 'pic': tan, title: 'Backend lead', 'email': "hsuan-yu.tan@ucdconnect.ie" },
  { 'name': 'Prakhar', 'pic': prakhar, title: 'Frontend lead', 'email': "prakhar.dayal@ucdconnect.ie" },
] 

const contactInfo = [
  { title: 'Address', icon: CiLocationOn, text: 'University College Dublin, Belfield\nDublin 4, Ireland,\nEircode: D04 V1W8'},
  { title: 'Phone', icon: CiPhone, text: 'UCD phone: +353 1 716 7777'},
  { title: 'Opening Hours', icon: CiTimer, text: 'Monday - Friday: 8:00 AM - 8:00 PM\nSaturday - Sunday: 9:00 AM - 6:00 PM'},
  { title: 'Team', icon: RiTeamLine, team},
]

const forms = [
  { label: 'Full Name', key: 'name' },
  { label: 'Email', key: 'email', placeholder: "example3345678@xmail.com" },
  { label: 'Phone', key: 'phone' },
  { label: 'Message', tag: 'textarea', key: 'message' },
]

const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]/
const phonePattern = /^(?:\+?\d{1,4})?[ -.]?(?:\(?\d{2,4}\)?)[ -.]?\d{3,4}[ -.]?\d{3,4}$/

type InfoType = {
  name: string;
  email: string;
  phone: string;
  message: string;
  [key: string]: string;
}

const infoObj = {
  name: "",
  email: "",
  phone: "",
  message: "",
}

const ContactPage = () => {
  const [isCompleted, setComplete] = useState<boolean>(false);
  const [isFailed, setFailed] = useState<boolean>(false);
  const [isError, setError] = useState<boolean>(true);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [info, setInfo] = useState<InfoType>(infoObj);
  const error = useMemo(() => {
    if (Object.values(info).some(d => Boolean(d))) {
      if (!info.name) {
        setError(true)
        return 'Name is required'
      } else if (!info.email) {
        setError(true)
        return 'Email is required'
      } else if (!info.message) {
        setError(true)
        return 'Message is required'
      }
      if (!emailPattern.test(info.email)) {
        setError(true)
        return 'Invalid email'
      }
      if (info.phone && !phonePattern.test(info.phone)) {
        setError(true)
        return 'Invalid phone number'
      }
      setError(false)
      return false
    }
  }, [info])
  // console.log(isError)
  return (
    <div className="flex-1 flex flex-col justify-center relative bg-green-300 pt-[5em]">
      <Heading className="text-center">Contact Us</Heading>
      <div className="container flex flex-col-reverse gap-8 lg:flex-row lg:gap-8">
        <div className="w-[60%] min-w-300px">
          <Heading level={2}>Get in Touch</Heading>
          {contactInfo.map(({ title, icon, text, team }, i) => (
            <div className="info-item" key={i}>
              <div className="mr-4">
                <Icon icon={icon} strokeWidth={team ? 0 : 1} size="2.5rem" />
              </div>
              <div>
                <p className="text-xl">{title}:</p>
                <div className="whitespace-pre-wrap">
                  {team ? (
                    <div className="mt-4 flex flex-wrap gap-4">
                      {team.map((member, i) => (
                        <div className="w-full lg:w-[48.25%]" key={i}>
                          <div className="flex gap-1 items-center">
                            {member.pic ? (
                              <Image width={60} src={member?.pic} alt={member.name} className="team-member-photo w-[60px] h-[60px]" />
                            ) : (
                              <div className="rounded-full bg-white mr-4">
                                <Icon icon={CiUser} size="3.75rem" />
                              </div>
                            )}  
                              <p className="font-bold text-xl flex-1">{member.name}</p>
                          </div>
                          <div className="mt-2">
                            <p className="my-1 text-lg">{member.title}</p>
                            <p><a href={ `mailto:${member.email}` }>{member.email}</a></p>
                          </div>
                      </div>
                      ))}
                    </div>
                  ) : text}
                </div>
              </div>
            </div>
          ))}
      </div>
        <div className="flex flex-col gap-4 flex-1 min-w-200px">
          {forms.map(({ label, tag, placeholder, key }) => (
            <div key={label}>
              <p className="mb-2 text-2xl font-bold">{label}</p>
              {tag ? (
                <textarea 
                  name={key}
                  value={info?.[key]}
                  disabled={isLoading}
                  className={`form outline-none ${isLoading && 'cursor-not-allowed'}`}
                  onChange={(e) => {
                    setInfo(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))
                  }} 
                />
              ) : (
                <Input
                  disabled={isLoading}
                  name={key}
                  value={info?.[key]}
                  placeholder={placeholder}
                  width="full"
                  className={"form"}
                  onChange={(e) => {
                    setInfo(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))
                  }} 
                />
              )}
            </div>
          ))}
          {isError && <p className="text-sm text-red-500">{error}</p>}
          <div className="label">
            <Button
              onClick={async () => {
                setLoading(true)
                const formData = new FormData()
                Object.keys(info).forEach(key => {
                  formData.append(key, info[key])
                });
                formData.append('time', new Date().toLocaleString())
                const res = await fetch('/api/contact', { method: 'POST', body: formData })
                const d = await res.json();
                if (d.status == "success") {
                  setComplete(true)
                  setLoading(false)
                  setTimeout(() => setComplete(false), 3000)
                  setInfo(infoObj)
                } else {
                  setFailed(true)
                  setLoading(false)
                  setTimeout(() => {
                    setComplete(false)
                    setFailed(false)
                  }, 2250)
                  setInfo(infoObj)
                }
              }}
              isDisabled={isLoading || isError}
            >
              {isLoading ? 'Loding...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
      <div className={`absolute center pop-up whitespace-pre-wrap trasition-opacity duration-250 ${isCompleted ? 'opacity-100' : 'opacity-0'}`}>
        {isFailed ? (
          "Sorry, failed to submit.\nPlease directly send a email to a team member"
        ) : (
          "Submission Completed\nWe'll inform you by email."
        )}
      </div>
    </div>
  );
};

export default ContactPage;
